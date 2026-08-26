import { pool } from "@/lib/db";
import { PoolClient } from "pg";
import { Product, CreateProductInput, UpdateProductInput } from "@/types/product/product.types";

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

export async function getProductById(id: string, includeDeleted: boolean = false, client?: PoolClient): Promise<Product | null> {
  const sql = `
    SELECT p.id, p.category_id, p.name, p.sku, p.description, p.price::DOUBLE PRECISION, p.minimum_stock, p.created_by, p.deleted_at, p.created_at, p.updated_at, i.location
    FROM products p
    LEFT JOIN inventory i ON p.id = i.product_id
    WHERE p.id = $1 ${includeDeleted ? "" : "AND p.deleted_at IS NULL"}
  `;
  const executor = client || pool;
  const result = await executor.query(sql, [id]);
  return result.rows[0] || null;
}

export async function getProductByIdForUpdate(id: string, client: PoolClient): Promise<Product | null> {
  const sql = `
    SELECT p.id, p.category_id, p.name, p.sku, p.description, p.price::DOUBLE PRECISION, p.minimum_stock, p.created_by, p.deleted_at, p.created_at, p.updated_at, i.location
    FROM products p
    LEFT JOIN inventory i ON p.id = i.product_id
    WHERE p.id = $1 AND p.deleted_at IS NULL
    FOR UPDATE
  `;
  const result = await client.query(sql, [id]);
  return result.rows[0] || null;
}

export async function getProductBySku(sku: string, includeDeleted: boolean = false, client?: PoolClient): Promise<Product | null> {
  const sql = `
    SELECT p.id, p.category_id, p.name, p.sku, p.description, p.price::DOUBLE PRECISION, p.minimum_stock, p.created_by, p.deleted_at, p.created_at, p.updated_at, i.location
    FROM products p
    LEFT JOIN inventory i ON p.id = i.product_id
    WHERE p.sku = $1 ${includeDeleted ? "" : "AND p.deleted_at IS NULL"}
  `;
  const executor = client || pool;
  const result = await executor.query(sql, [sku]);
  return result.rows[0] || null;
}

export async function getProductByName(name: string, includeDeleted: boolean = false, client?: PoolClient): Promise<Product | null> {
  const sql = `
    SELECT p.id, p.category_id, p.name, p.sku, p.description, p.price::DOUBLE PRECISION, p.minimum_stock, p.created_by, p.deleted_at, p.created_at, p.updated_at, i.location
    FROM products p
    LEFT JOIN inventory i ON p.id = i.product_id
    WHERE p.name = $1 ${includeDeleted ? "" : "AND p.deleted_at IS NULL"}
  `;
  const executor = client || pool;
  const result = await executor.query(sql, [name]);
  return result.rows[0] || null;
}

export async function getProducts(
  filters?: { categoryId?: string; search?: string; includeDeleted?: boolean },
  client?: PoolClient
): Promise<Product[]> {
  let sql = `
    SELECT p.id, p.category_id, p.name, p.sku, p.description, p.price::DOUBLE PRECISION, p.minimum_stock, p.created_by, p.deleted_at, p.created_at, p.updated_at, i.location
    FROM products p
    LEFT JOIN inventory i ON p.id = i.product_id
  `;
  
  const conditions: string[] = [];
  const params: any[] = [];

  if (!filters?.includeDeleted) {
    conditions.push("p.deleted_at IS NULL");
  }

  if (filters?.categoryId) {
    params.push(filters.categoryId);
    conditions.push(`p.category_id = $${params.length}`);
  }

  if (filters?.search) {
    params.push(`%${filters.search}%`);
    conditions.push(`(p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`);
  }

  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }

  sql += " ORDER BY p.name ASC";

  const executor = client || pool;
  const result = await executor.query(sql, params);
  return result.rows;
}

export async function createProduct(input: CreateProductInput, client?: PoolClient): Promise<Product> {
  const sql = `
    INSERT INTO products (category_id, name, sku, description, price, minimum_stock, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, category_id, name, sku, description, price::DOUBLE PRECISION, minimum_stock, created_by, deleted_at, created_at, updated_at
  `;
  const executor = client || pool;
  const values = [
    input.category_id,
    input.name,
    input.sku,
    input.description ?? null,
    input.price,
    input.minimum_stock ?? 0,
    input.created_by ?? null
  ];
  const result = await executor.query(sql, values);
  return {
    ...result.rows[0],
    location: input.location ?? null
  };
}

export async function updateProduct(id: string, input: UpdateProductInput, client?: PoolClient): Promise<Product | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  // We only update columns that are present on the products table
  const productCols = ["category_id", "name", "sku", "description", "price", "minimum_stock"];

  Object.entries(input).forEach(([key, val]) => {
    if (val !== undefined && productCols.includes(key)) {
      fields.push(`${key} = $${idx++}`);
      values.push(val);
    }
  });

  if (fields.length === 0) {
    return getProductById(id, false, client);
  }

  fields.push("updated_at = NOW()");
  values.push(id);

  const sql = `
    UPDATE products
    SET ${fields.join(", ")}
    WHERE id = $${idx} AND deleted_at IS NULL
    RETURNING id, category_id, name, sku, description, price::DOUBLE PRECISION, minimum_stock, created_by, deleted_at, created_at, updated_at
  `;

  const executor = client || pool;
  const result = await executor.query(sql, values);
  if (!result.rows[0]) return null;

  return {
    ...result.rows[0],
    location: input.location !== undefined ? input.location : null
  };
}

export async function softDeleteProduct(id: string, client?: PoolClient): Promise<boolean> {
  const sql = `
    UPDATE products
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL
  `;
  const executor = client || pool;
  const result = await executor.query(sql, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function restoreProduct(id: string, client?: PoolClient): Promise<boolean> {
  const sql = `
    UPDATE products
    SET deleted_at = NULL, updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NOT NULL
  `;
  const executor = client || pool;
  const result = await executor.query(sql, [id]);
  return (result.rowCount ?? 0) > 0;
}
