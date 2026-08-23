import { pool } from "@/lib/db";
import { PoolClient } from "pg";
import {
  Inventory,
  CreateInventoryInput,
  UpdateInventoryInput,
  StockMovement,
  CreateStockMovementInput
} from "@/types/inventory/inventory.types";

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getInventoryByProductId(productId: string, client?: PoolClient): Promise<Inventory | null> {
  const sql = `
    SELECT id, product_id, quantity, reserved_quantity, location, created_at, updated_at
    FROM inventory
    WHERE product_id = $1
  `;
  const executor = client || pool;
  const result = await executor.query(sql, [productId]);
  return result.rows[0] || null;
}

export async function getInventoryByProductIdForUpdate(productId: string, client: PoolClient): Promise<Inventory | null> {
  const sql = `
    SELECT id, product_id, quantity, reserved_quantity, location, created_at, updated_at
    FROM inventory
    WHERE product_id = $1
    FOR UPDATE
  `;
  const result = await client.query(sql, [productId]);
  return result.rows[0] || null;
}

export async function createInventory(input: CreateInventoryInput, client?: PoolClient): Promise<Inventory> {
  const sql = `
    INSERT INTO inventory (product_id, quantity, reserved_quantity, location)
    VALUES ($1, $2, $3, $4)
    RETURNING id, product_id, quantity, reserved_quantity, location, created_at, updated_at
  `;
  const executor = client || pool;
  const params = [
    input.product_id,
    input.quantity !== undefined ? input.quantity : 0,
    input.reserved_quantity !== undefined ? input.reserved_quantity : 0,
    input.location || null
  ];
  const result = await executor.query(sql, params);
  return result.rows[0];
}

export async function updateInventory(
  productId: string,
  input: UpdateInventoryInput,
  client?: PoolClient
): Promise<Inventory | null> {
  const setClauses: string[] = [];
  const params: any[] = [productId];

  if (input.quantity !== undefined) {
    params.push(input.quantity);
    setClauses.push(`quantity = $${params.length}`);
  }
  if (input.reserved_quantity !== undefined) {
    params.push(input.reserved_quantity);
    setClauses.push(`reserved_quantity = $${params.length}`);
  }
  if (input.location !== undefined) {
    params.push(input.location);
    setClauses.push(`location = $${params.length}`);
  }

  if (setClauses.length === 0) {
    return getInventoryByProductId(productId, client);
  }

  setClauses.push("updated_at = NOW()");
  const sql = `
    UPDATE inventory
    SET ${setClauses.join(", ")}
    WHERE product_id = $1
    RETURNING id, product_id, quantity, reserved_quantity, location, created_at, updated_at
  `;
  const executor = client || pool;
  const result = await executor.query(sql, params);
  return result.rows[0] || null;
}

export async function createStockMovement(input: CreateStockMovementInput, client?: PoolClient): Promise<StockMovement> {
  const sql = `
    INSERT INTO stock_movements (product_id, quantity, type, reason, created_by)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, product_id, quantity, type, reason, created_by, created_at
  `;
  const executor = client || pool;
  const params = [
    input.product_id,
    input.quantity,
    input.type,
    input.reason || null,
    input.created_by || null
  ];
  const result = await executor.query(sql, params);
  return result.rows[0];
}

export async function getStockMovements(productId?: string): Promise<StockMovement[]> {
  let sql = `
    SELECT id, product_id, quantity, type, reason, created_by, created_at
    FROM stock_movements
  `;
  const params: any[] = [];
  if (productId) {
    params.push(productId);
    sql += " WHERE product_id = $1";
  }
  sql += " ORDER BY created_at DESC";
  const result = await pool.query(sql, params);
  return result.rows;
}
