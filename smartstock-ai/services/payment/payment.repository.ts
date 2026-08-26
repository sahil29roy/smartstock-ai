import { pool } from "@/lib/db";
import { PoolClient } from "pg";
import { Payment } from "@/types/sales/sales.types";

export {
  withTransaction,
  createPayment,
  getPaymentById,
  getPaymentByIdForUpdate,
  updatePaymentStatus,
  getPaymentsBySaleId
} from "../sales/sales.repository";

export async function getPayments(
  filters?: { saleId?: string; status?: string },
  client?: PoolClient
): Promise<Payment[]> {
  let sql = `
    SELECT id, sale_id, account_id, amount, payment_date, payment_method, status, created_by, created_at, updated_at
    FROM payments
  `;
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters?.saleId) {
    params.push(filters.saleId);
    conditions.push(`sale_id = $${params.length}`);
  }
  if (filters?.status) {
    params.push(filters.status);
    conditions.push(`status = $${params.length}`);
  }

  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }
  sql += " ORDER BY payment_date DESC";

  const executor = client || pool;
  const result = await executor.query(sql, params);
  return result.rows.map(row => ({
    ...row,
    amount: parseFloat(row.amount)
  }));
}
