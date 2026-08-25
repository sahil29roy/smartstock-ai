import { pool } from "@/lib/db";
import { AccountBalanceDetail, PaymentMethodBreakdown } from "@/types/reports/reports.types";

export async function getTotalRevenue(
  startDate: Date | null,
  endDate: Date | null
): Promise<number> {
  const sql = `
    SELECT COALESCE(SUM(amount), 0.00)::DOUBLE PRECISION as total
    FROM payments
    WHERE status = 'COMPLETED'
      AND ($1::TIMESTAMPTZ IS NULL OR payment_date >= $1)
      AND ($2::TIMESTAMPTZ IS NULL OR payment_date <= $2)
  `;
  const result = await pool.query(sql, [startDate, endDate]);
  return result.rows[0]?.total || 0;
}

export async function getTotalReceivables(
  startDate: Date | null,
  endDate: Date | null
): Promise<number> {
  const sql = `
    SELECT COALESCE(SUM(s.total_amount - COALESCE(p.paid_amount, 0.00)), 0.00)::DOUBLE PRECISION as "totalReceivables"
    FROM sales s
    LEFT JOIN (
      SELECT sale_id, SUM(amount) as paid_amount
      FROM payments
      WHERE status = 'COMPLETED'
      GROUP BY sale_id
    ) p ON s.id = p.sale_id
    WHERE s.status <> 'CANCELLED'
      AND ($1::TIMESTAMPTZ IS NULL OR s.created_at >= $1)
      AND ($2::TIMESTAMPTZ IS NULL OR s.created_at <= $2)
  `;
  const result = await pool.query(sql, [startDate, endDate]);
  return result.rows[0]?.totalReceivables || 0;
}

export async function getAccountBalances(): Promise<AccountBalanceDetail[]> {
  const sql = `
    SELECT 
      id as "accountId", 
      name as "accountName", 
      type, 
      balance::DOUBLE PRECISION
    FROM accounts
    ORDER BY name ASC
  `;
  const result = await pool.query(sql);
  return result.rows;
}

export async function getPaymentsMethodSummary(
  startDate: Date | null,
  endDate: Date | null
): Promise<PaymentMethodBreakdown[]> {
  const sql = `
    SELECT
      payment_method as "paymentMethod",
      SUM(amount)::DOUBLE PRECISION as "totalAmount",
      COUNT(*)::INT as count
    FROM payments
    WHERE status = 'COMPLETED'
      AND ($1::TIMESTAMPTZ IS NULL OR payment_date >= $1)
      AND ($2::TIMESTAMPTZ IS NULL OR payment_date <= $2)
    GROUP BY payment_method
    ORDER BY "totalAmount" DESC
  `;
  const result = await pool.query(sql, [startDate, endDate]);
  return result.rows;
}
