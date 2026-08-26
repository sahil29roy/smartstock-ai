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

export async function createPurchasePayment(
  input: { purchase_id: string; account_id: string; amount: number; payment_method: string; status?: string; created_by?: string | null },
  client?: PoolClient
): Promise<Payment> {
  const sql = `
    INSERT INTO payments (purchase_id, account_id, amount, payment_method, status, created_by)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, sale_id, purchase_id, account_id, amount, payment_date, payment_method, status, created_by, created_at, updated_at
  `;
  const executor = client || pool;
  const params = [
    input.purchase_id,
    input.account_id,
    input.amount,
    input.payment_method,
    input.status || "COMPLETED",
    input.created_by || null
  ];
  const result = await executor.query(sql, params);
  const row = result.rows[0];
  return {
    ...row,
    amount: parseFloat(row.amount)
  };
}

export async function getPaymentsByPurchaseId(purchaseId: string, client?: PoolClient): Promise<Payment[]> {
  const sql = `
    SELECT id, sale_id, purchase_id, account_id, amount, payment_date, payment_method, status, created_by, created_at, updated_at
    FROM payments
    WHERE purchase_id = $1
    ORDER BY payment_date DESC
  `;
  const executor = client || pool;
  const result = await executor.query(sql, [purchaseId]);
  return result.rows.map(row => ({
    ...row,
    amount: parseFloat(row.amount)
  }));
}

export async function getPayments(
  filters?: { saleId?: string; purchaseId?: string; status?: string },
  client?: PoolClient
): Promise<Payment[]> {
  let sql = `
    SELECT id, sale_id, purchase_id, account_id, amount, payment_date, payment_method, status, created_by, created_at, updated_at
    FROM payments
  `;
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters?.saleId) {
    params.push(filters.saleId);
    conditions.push(`sale_id = $${params.length}`);
  }
  if (filters?.purchaseId) {
    params.push(filters.purchaseId);
    conditions.push(`purchase_id = $${params.length}`);
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
