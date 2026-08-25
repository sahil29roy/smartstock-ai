import { pool } from "@/lib/db";
import { CustomerReportItem } from "@/types/reports/reports.types";

export async function getCustomerReport(
  startDate: Date | null,
  endDate: Date | null,
  limit: number
): Promise<CustomerReportItem[]> {
  const sql = `
    SELECT
      c.id as "customerId",
      c.name as "customerName",
      c.email,
      c.phone,
      COALESCE(SUM(s.total_amount), 0.00)::DOUBLE PRECISION as "totalSales",
      COUNT(s.id)::INT as "salesCount",
      COALESCE(SUM(pay.paid_amount), 0.00)::DOUBLE PRECISION as "totalPaid",
      COALESCE(SUM(s.total_amount - COALESCE(pay.paid_amount, 0.00)), 0.00)::DOUBLE PRECISION as "totalPending",
      MAX(s.created_at) as "lastPurchaseDate"
    FROM customers c
    LEFT JOIN sales s ON c.id = s.customer_id AND s.status <> 'CANCELLED'
    LEFT JOIN (
      SELECT sale_id, SUM(amount) as paid_amount
      FROM payments
      WHERE status = 'COMPLETED'
      GROUP BY sale_id
    ) pay ON s.id = pay.sale_id
    WHERE c.deleted_at IS NULL
      AND ($1::TIMESTAMPTZ IS NULL OR s.created_at >= $1)
      AND ($2::TIMESTAMPTZ IS NULL OR s.created_at <= $2)
    GROUP BY c.id, c.name, c.email, c.phone
    ORDER BY "totalSales" DESC
    LIMIT $3
  `;
  const result = await pool.query(sql, [startDate, endDate, limit]);
  return result.rows.map(row => ({
    customerId: row.customerId,
    customerName: row.customerName,
    email: row.email,
    phone: row.phone,
    totalSales: row.totalSales,
    salesCount: row.salesCount,
    totalPaid: row.totalPaid,
    totalPending: row.totalPending,
    lastPurchaseDate: row.lastPurchaseDate ? new Date(row.lastPurchaseDate) : null
  }));
}
