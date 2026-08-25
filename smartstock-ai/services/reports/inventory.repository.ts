import { pool } from "@/lib/db";
import { LowStockDetailItem, RecentStockMovement } from "@/types/reports/reports.types";

export async function getInventorySummary(
  categoryId: string | null
): Promise<{
  totalItems: number;
  totalValue: number;
  uniqueProductsCount: number;
  lowStockItemsCount: number;
  outOfStockItemsCount: number;
}> {
  const sql = `
    SELECT
      COALESCE(SUM(i.quantity), 0)::INT as "totalItems",
      COALESCE(SUM(i.quantity * p.price), 0.00)::DOUBLE PRECISION as "totalValue",
      COUNT(i.id)::INT as "uniqueProductsCount",
      COALESCE(SUM(CASE WHEN i.quantity <= p.minimum_stock THEN 1 ELSE 0 END), 0)::INT as "lowStockItemsCount",
      COALESCE(SUM(CASE WHEN i.quantity = 0 THEN 1 ELSE 0 END), 0)::INT as "outOfStockItemsCount"
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    WHERE p.deleted_at IS NULL
      AND ($1::UUID IS NULL OR p.category_id = $1)
  `;
  const result = await pool.query(sql, [categoryId]);
  return result.rows[0];
}

export async function getLowStockDetails(
  categoryId: string | null
): Promise<LowStockDetailItem[]> {
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
      AND ($1::UUID IS NULL OR p.category_id = $1)
    ORDER BY i.quantity ASC
  `;
  const result = await pool.query(sql, [categoryId]);
  return result.rows;
}

export async function getRecentMovements(
  categoryId: string | null
): Promise<RecentStockMovement[]> {
  const sql = `
    SELECT
      sm.id,
      sm.product_id as "productId",
      p.name as "productName",
      p.sku,
      sm.type,
      sm.quantity,
      sm.reason,
      sm.created_at as "createdAt"
    FROM stock_movements sm
    JOIN products p ON sm.product_id = p.id
    WHERE ($1::UUID IS NULL OR p.category_id = $1)
    ORDER BY sm.created_at DESC
    LIMIT 20;
  `;
  const result = await pool.query(sql, [categoryId]);
  return result.rows.map(row => ({
    id: row.id,
    productId: row.productId,
    productName: row.productName,
    type: row.type as 'IN' | 'OUT' | 'ADJUSTMENT',
    quantity: row.quantity,
    reason: row.reason,
    createdAt: new Date(row.createdAt)
  }));
}
