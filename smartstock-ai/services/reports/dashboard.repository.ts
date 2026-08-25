import { pool } from "@/lib/db";
import { LowStockDetailItem, RecentActivityFeedItem, SalesTrendPoint } from "@/types/reports/reports.types";

export async function getSalesTotalAndCount(
  startDate: Date | null,
  endDate: Date | null
): Promise<{ totalSales: number; orderCount: number }> {
  const sql = `
    SELECT 
      COALESCE(SUM(total_amount), 0.00)::DOUBLE PRECISION as "totalSales",
      COUNT(*)::INT as "orderCount"
    FROM sales
    WHERE status <> 'CANCELLED'
      AND ($1::TIMESTAMPTZ IS NULL OR created_at >= $1)
      AND ($2::TIMESTAMPTZ IS NULL OR created_at <= $2)
  `;
  const result = await pool.query(sql, [startDate, endDate]);
  return result.rows[0];
}

export async function getSalesTotalForPeriod(
  startDate: Date,
  endDate: Date
): Promise<number> {
  const sql = `
    SELECT COALESCE(SUM(total_amount), 0.00)::DOUBLE PRECISION as total
    FROM sales
    WHERE status <> 'CANCELLED'
      AND created_at >= $1
      AND created_at <= $2
  `;
  const result = await pool.query(sql, [startDate, endDate]);
  return result.rows[0]?.total || 0;
}

export async function getLowStockCount(): Promise<number> {
  const sql = `
    SELECT COUNT(*)::INT as count
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    WHERE p.deleted_at IS NULL
      AND i.quantity <= p.minimum_stock
  `;
  const result = await pool.query(sql);
  return result.rows[0]?.count || 0;
}

export async function getAccountsBalance(): Promise<number> {
  const sql = `
    SELECT COALESCE(SUM(balance), 0.00)::DOUBLE PRECISION as balance
    FROM accounts
    WHERE type IN ('CASH', 'BANK')
  `;
  const result = await pool.query(sql);
  return result.rows[0]?.balance || 0;
}

export async function getReceivablesAmount(
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

export async function getRecentActivity(): Promise<RecentActivityFeedItem[]> {
  const sql = `
    (
      SELECT 
        s.id::TEXT, 
        'sale' as type, 
        'New sale created for customer ' || c.name as description, 
        s.total_amount::DOUBLE PRECISION as amount, 
        s.created_at as date
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      WHERE s.status <> 'CANCELLED'
      ORDER BY s.created_at DESC 
      LIMIT 10
    )
    UNION ALL
    (
      SELECT 
        id::TEXT, 
        'payment' as type, 
        'Payment of ' || amount || ' received via ' || payment_method as description, 
        amount::DOUBLE PRECISION as amount, 
        payment_date as date
      FROM payments
      WHERE status = 'COMPLETED'
      ORDER BY payment_date DESC 
      LIMIT 10
    )
    UNION ALL
    (
      SELECT 
        sm.id::TEXT, 
        'stock_movement' as type, 
        'Stock movement ' || sm.type || ' (' || sm.quantity || ') for ' || p.name as description, 
        NULL::DOUBLE PRECISION as amount, 
        sm.created_at as date
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      ORDER BY sm.created_at DESC 
      LIMIT 10
    )
    ORDER BY date DESC 
    LIMIT 20
  `;
  const result = await pool.query(sql);
  return result.rows.map(row => ({
    id: row.id,
    type: row.type as 'sale' | 'payment' | 'stock_movement',
    description: row.description,
    amount: row.amount !== null ? parseFloat(row.amount) : undefined,
    date: new Date(row.date)
  }));
}

export async function getSalesTrend(
  startDate: Date | null,
  endDate: Date | null,
  groupBy: 'day' | 'week' | 'month'
): Promise<SalesTrendPoint[]> {
  const interval = groupBy === 'day' ? 'day' : groupBy === 'week' ? 'week' : 'month';
  const format = groupBy === 'day' ? 'YYYY-MM-DD' : groupBy === 'week' ? 'YYYY-"W"IW' : 'YYYY-MM';

  const sql = `
    SELECT
      TO_CHAR(DATE_TRUNC($3, created_at), $4) as date,
      COALESCE(SUM(total_amount), 0.00)::DOUBLE PRECISION as amount,
      COUNT(*)::INT as "orderCount"
    FROM sales
    WHERE status <> 'CANCELLED'
      AND ($1::TIMESTAMPTZ IS NULL OR created_at >= $1)
      AND ($2::TIMESTAMPTZ IS NULL OR created_at <= $2)
    GROUP BY DATE_TRUNC($3, created_at)
    ORDER BY DATE_TRUNC($3, created_at) ASC
  `;
  const result = await pool.query(sql, [startDate, endDate, interval, format]);
  return result.rows;
}

export async function getLowStockAlerts(): Promise<LowStockDetailItem[]> {
  const sql = `
    SELECT
      p.id as "productId",
      p.name as "productName",
      p.sku,
      i.quantity as "currentStock",
      p.minimum_stock as "minimumStock",
      i.location
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    WHERE p.deleted_at IS NULL
      AND i.quantity <= p.minimum_stock
    ORDER BY i.quantity ASC
    LIMIT 10
  `;
  const result = await pool.query(sql);
  return result.rows;
}
