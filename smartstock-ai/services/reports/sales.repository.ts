import { pool } from "@/lib/db";
import { CategorySalesPerformance, SalesTrendPoint, TopProductPerformance } from "@/types/reports/reports.types";

export async function getSalesSummary(
  startDate: Date | null,
  endDate: Date | null,
  categoryId: string | null,
  productId: string | null
): Promise<{ totalSales: number; totalOrders: number; averageOrderValue: number }> {
  const sql = `
    SELECT
      COALESCE(SUM(si.quantity * si.unit_price), 0.00)::DOUBLE PRECISION as "totalSales",
      COUNT(DISTINCT s.id)::INT as "totalOrders",
      CASE 
        WHEN COUNT(DISTINCT s.id) > 0 THEN COALESCE(SUM(si.quantity * si.unit_price), 0.00) / COUNT(DISTINCT s.id) 
        ELSE 0.00 
      END::DOUBLE PRECISION as "averageOrderValue"
    FROM sales s
    JOIN sale_items si ON s.id = si.sale_id
    JOIN products p ON si.product_id = p.id
    WHERE s.status <> 'CANCELLED'
      AND ($1::TIMESTAMPTZ IS NULL OR s.created_at >= $1)
      AND ($2::TIMESTAMPTZ IS NULL OR s.created_at <= $2)
      AND ($3::UUID IS NULL OR p.category_id = $3)
      AND ($4::UUID IS NULL OR si.product_id = $4)
  `;
  const result = await pool.query(sql, [startDate, endDate, categoryId, productId]);
  return result.rows[0];
}

export async function getSalesTrend(
  startDate: Date | null,
  endDate: Date | null,
  groupBy: 'day' | 'week' | 'month' | 'product' | 'category',
  categoryId: string | null,
  productId: string | null
): Promise<SalesTrendPoint[]> {
  if (groupBy === 'product') {
    const sql = `
      SELECT
        p.name as date,
        COALESCE(SUM(si.quantity * si.unit_price), 0.00)::DOUBLE PRECISION as amount,
        COUNT(DISTINCT s.id)::INT as "orderCount"
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN products p ON si.product_id = p.id
      WHERE s.status <> 'CANCELLED'
        AND ($1::TIMESTAMPTZ IS NULL OR s.created_at >= $1)
        AND ($2::TIMESTAMPTZ IS NULL OR s.created_at <= $2)
        AND ($3::UUID IS NULL OR p.category_id = $3)
        AND ($4::UUID IS NULL OR si.product_id = $4)
      GROUP BY p.id, p.name
      ORDER BY amount DESC
      LIMIT 50
    `;
    const result = await pool.query(sql, [startDate, endDate, categoryId, productId]);
    return result.rows;
  }

  if (groupBy === 'category') {
    const sql = `
      SELECT
        c.name as date,
        COALESCE(SUM(si.quantity * si.unit_price), 0.00)::DOUBLE PRECISION as amount,
        COUNT(DISTINCT s.id)::INT as "orderCount"
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN products p ON si.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE s.status <> 'CANCELLED'
        AND ($1::TIMESTAMPTZ IS NULL OR s.created_at >= $1)
        AND ($2::TIMESTAMPTZ IS NULL OR s.created_at <= $2)
        AND ($3::UUID IS NULL OR p.category_id = $3)
        AND ($4::UUID IS NULL OR si.product_id = $4)
      GROUP BY c.id, c.name
      ORDER BY amount DESC
      LIMIT 50
    `;
    const result = await pool.query(sql, [startDate, endDate, categoryId, productId]);
    return result.rows;
  }

  const interval = groupBy === 'day' ? 'day' : groupBy === 'week' ? 'week' : 'month';
  const format = groupBy === 'day' ? 'YYYY-MM-DD' : groupBy === 'week' ? 'YYYY-"W"IW' : 'YYYY-MM';

  const sql = `
    SELECT
      TO_CHAR(DATE_TRUNC($5, s.created_at), $6) as date,
      COALESCE(SUM(si.quantity * si.unit_price), 0.00)::DOUBLE PRECISION as amount,
      COUNT(DISTINCT s.id)::INT as "orderCount"
    FROM sales s
    JOIN sale_items si ON s.id = si.sale_id
    JOIN products p ON si.product_id = p.id
    WHERE s.status <> 'CANCELLED'
      AND ($1::TIMESTAMPTZ IS NULL OR s.created_at >= $1)
      AND ($2::TIMESTAMPTZ IS NULL OR s.created_at <= $2)
      AND ($3::UUID IS NULL OR p.category_id = $3)
      AND ($4::UUID IS NULL OR si.product_id = $4)
    GROUP BY DATE_TRUNC($5, s.created_at)
    ORDER BY DATE_TRUNC($5, s.created_at) ASC
  `;
  const result = await pool.query(sql, [startDate, endDate, categoryId, productId, interval, format]);
  return result.rows;
}

export async function getTopProducts(
  startDate: Date | null,
  endDate: Date | null,
  categoryId: string | null,
  productId: string | null
): Promise<TopProductPerformance[]> {
  const sql = `
    SELECT
      p.id as "productId",
      p.name as "productName",
      p.sku,
      SUM(si.quantity)::INT as "quantitySold",
      COALESCE(SUM(si.quantity * si.unit_price), 0.00)::DOUBLE PRECISION as revenue
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    JOIN products p ON si.product_id = p.id
    WHERE s.status <> 'CANCELLED'
      AND ($1::TIMESTAMPTZ IS NULL OR s.created_at >= $1)
      AND ($2::TIMESTAMPTZ IS NULL OR s.created_at <= $2)
      AND ($3::UUID IS NULL OR p.category_id = $3)
      AND ($4::UUID IS NULL OR si.product_id = $4)
    GROUP BY p.id, p.name, p.sku
    ORDER BY revenue DESC
    LIMIT 10
  `;
  const result = await pool.query(sql, [startDate, endDate, categoryId, productId]);
  return result.rows;
}

export async function getSalesByCategory(
  startDate: Date | null,
  endDate: Date | null,
  categoryId: string | null,
  productId: string | null
): Promise<CategorySalesPerformance[]> {
  const sql = `
    SELECT
      c.id as "categoryId",
      c.name as "categoryName",
      COALESCE(SUM(si.quantity * si.unit_price), 0.00)::DOUBLE PRECISION as revenue,
      SUM(si.quantity)::INT as "quantitySold"
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    JOIN products p ON si.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    WHERE s.status <> 'CANCELLED'
      AND ($1::TIMESTAMPTZ IS NULL OR s.created_at >= $1)
      AND ($2::TIMESTAMPTZ IS NULL OR s.created_at <= $2)
      AND ($3::UUID IS NULL OR p.category_id = $3)
      AND ($4::UUID IS NULL OR si.product_id = $4)
    GROUP BY c.id, c.name
    ORDER BY revenue DESC
  `;
  const result = await pool.query(sql, [startDate, endDate, categoryId, productId]);
  return result.rows;
}
