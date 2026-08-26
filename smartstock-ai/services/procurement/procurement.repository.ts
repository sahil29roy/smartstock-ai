import { pool } from "@/lib/db";
import { PoolClient } from "pg";
import {
  Supplier,
  CreateSupplierInput,
  UpdateSupplierInput,
  Purchase,
  CreatePurchaseInput,
  UpdatePurchaseInput,
  PurchaseItem,
  CreatePurchaseItemInput,
  GoodsReceipt,
  CreateGoodsReceiptInput,
  GoodsReceiptItem,
  CreateGoodsReceiptItemInput,
  PurchaseStatus,
  GoodsReceiptStatus
} from "@/types/procurement/procurement.types";

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

// === Suppliers Repository ===

export async function createSupplier(input: CreateSupplierInput, client?: PoolClient): Promise<Supplier> {
  const sql = `
    INSERT INTO suppliers (name, email, phone, address, is_active, created_by)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, name, email, phone, address, is_active, created_by, deleted_at, created_at, updated_at
  `;
  const executor = client || pool;
  const params = [
    input.name,
    input.email,
    input.phone || null,
    input.address || null,
    input.is_active !== undefined ? input.is_active : true,
    input.created_by || null
  ];
  const result = await executor.query(sql, params);
  return result.rows[0];
}

export async function getSupplierById(id: string, client?: PoolClient): Promise<Supplier | null> {
  const sql = `
    SELECT id, name, email, phone, address, is_active, created_by, deleted_at, created_at, updated_at
    FROM suppliers
    WHERE id = $1
  `;
  const executor = client || pool;
  const result = await executor.query(sql, [id]);
  return result.rows[0] || null;
}

export async function getSupplierByName(name: string, client?: PoolClient): Promise<Supplier | null> {
  const sql = `
    SELECT id, name, email, phone, address, is_active, created_by, deleted_at, created_at, updated_at
    FROM suppliers
    WHERE name = $1 AND deleted_at IS NULL
  `;
  const executor = client || pool;
  const result = await executor.query(sql, [name]);
  return result.rows[0] || null;
}

export async function updateSupplier(
  id: string,
  input: UpdateSupplierInput,
  client?: PoolClient
): Promise<Supplier | null> {
  const setClauses: string[] = [];
  const params: any[] = [id];

  if (input.name !== undefined) {
    params.push(input.name);
    setClauses.push(`name = $${params.length}`);
  }
  if (input.email !== undefined) {
    params.push(input.email);
    setClauses.push(`email = $${params.length}`);
  }
  if (input.phone !== undefined) {
    params.push(input.phone);
    setClauses.push(`phone = $${params.length}`);
  }
  if (input.address !== undefined) {
    params.push(input.address);
    setClauses.push(`address = $${params.length}`);
  }
  if (input.is_active !== undefined) {
    params.push(input.is_active);
    setClauses.push(`is_active = $${params.length}`);
  }

  if (setClauses.length === 0) {
    return getSupplierById(id, client);
  }

  setClauses.push("updated_at = NOW()");
  const sql = `
    UPDATE suppliers
    SET ${setClauses.join(", ")}
    WHERE id = $1
    RETURNING id, name, email, phone, address, is_active, created_by, deleted_at, created_at, updated_at
  `;
  const executor = client || pool;
  const result = await executor.query(sql, params);
  return result.rows[0] || null;
}

export async function deleteSupplier(id: string, client?: PoolClient): Promise<Supplier | null> {
  const sql = `
    UPDATE suppliers
    SET deleted_at = NOW(), is_active = false, updated_at = NOW()
    WHERE id = $1
    RETURNING id, name, email, phone, address, is_active, created_by, deleted_at, created_at, updated_at
  `;
  const executor = client || pool;
  const result = await executor.query(sql, [id]);
  return result.rows[0] || null;
}

export async function getSuppliers(
  filters?: { search?: string; activeOnly?: boolean },
  client?: PoolClient
): Promise<Supplier[]> {
  let sql = `
    SELECT id, name, email, phone, address, is_active, created_by, deleted_at, created_at, updated_at
    FROM suppliers
    WHERE deleted_at IS NULL
  `;
  const params: any[] = [];

  if (filters?.activeOnly) {
    sql += " AND is_active = true";
  }
  if (filters?.search) {
    params.push(`%${filters.search}%`);
    sql += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})`;
  }

  sql += " ORDER BY name ASC";

  const executor = client || pool;
  const result = await executor.query(sql, params);
  return result.rows;
}

// === Purchases Repository ===

export async function createPurchase(
  input: { supplier_id: string; total_amount: number; status?: PurchaseStatus; created_by?: string | null },
  client?: PoolClient
): Promise<Purchase> {
  const sql = `
    INSERT INTO purchases (supplier_id, total_amount, status, created_by)
    VALUES ($1, $2, $3, $4)
    RETURNING id, supplier_id, total_amount, status, created_by, created_at, updated_at
  `;
  const executor = client || pool;
  const params = [
    input.supplier_id,
    input.total_amount,
    input.status || "DRAFT",
    input.created_by || null
  ];
  const result = await executor.query(sql, params);
  const row = result.rows[0];
  return {
    ...row,
    total_amount: parseFloat(row.total_amount)
  };
}

export async function getPurchaseById(id: string, client?: PoolClient): Promise<Purchase | null> {
  const sql = `
    SELECT id, supplier_id, total_amount, status, created_by, created_at, updated_at
    FROM purchases
    WHERE id = $1
  `;
  const executor = client || pool;
  const result = await executor.query(sql, [id]);
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...row,
    total_amount: parseFloat(row.total_amount)
  };
}

export async function getPurchaseByIdForUpdate(id: string, client: PoolClient): Promise<Purchase | null> {
  const sql = `
    SELECT id, supplier_id, total_amount, status, created_by, created_at, updated_at
    FROM purchases
    WHERE id = $1
    FOR UPDATE
  `;
  const result = await client.query(sql, [id]);
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...row,
    total_amount: parseFloat(row.total_amount)
  };
}

export async function updatePurchase(
  id: string,
  input: UpdatePurchaseInput,
  client?: PoolClient
): Promise<Purchase | null> {
  const setClauses: string[] = [];
  const params: any[] = [id];

  if (input.total_amount !== undefined) {
    params.push(input.total_amount);
    setClauses.push(`total_amount = $${params.length}`);
  }
  if (input.status !== undefined) {
    params.push(input.status);
    setClauses.push(`status = $${params.length}`);
  }
  if (input.supplier_id !== undefined) {
    params.push(input.supplier_id);
    setClauses.push(`supplier_id = $${params.length}`);
  }

  if (setClauses.length === 0) {
    return getPurchaseById(id, client);
  }

  setClauses.push("updated_at = NOW()");
  const sql = `
    UPDATE purchases
    SET ${setClauses.join(", ")}
    WHERE id = $1
    RETURNING id, supplier_id, total_amount, status, created_by, created_at, updated_at
  `;
  const executor = client || pool;
  const result = await executor.query(sql, params);
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...row,
    total_amount: parseFloat(row.total_amount)
  };
}

export async function getPurchases(
  filters?: { supplierId?: string; status?: PurchaseStatus },
  client?: PoolClient
): Promise<Purchase[]> {
  let sql = `
    SELECT id, supplier_id, total_amount, status, created_by, created_at, updated_at
    FROM purchases
  `;
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters?.supplierId) {
    params.push(filters.supplierId);
    conditions.push(`supplier_id = $${params.length}`);
  }
  if (filters?.status) {
    params.push(filters.status);
    conditions.push(`status = $${params.length}`);
  }

  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }
  sql += " ORDER BY created_at DESC";

  const executor = client || pool;
  const result = await executor.query(sql, params);
  return result.rows.map(row => ({
    ...row,
    total_amount: parseFloat(row.total_amount)
  }));
}

// === Purchase Items Repository ===

export async function createPurchaseItem(input: CreatePurchaseItemInput, client?: PoolClient): Promise<PurchaseItem> {
  const sql = `
    INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_cost)
    VALUES ($1, $2, $3, $4)
    RETURNING id, purchase_id, product_id, quantity, received_quantity, unit_cost, created_at
  `;
  const executor = client || pool;
  const params = [
    input.purchase_id,
    input.product_id,
    input.quantity,
    input.unit_cost
  ];
  const result = await executor.query(sql, params);
  const row = result.rows[0];
  return {
    ...row,
    unit_cost: parseFloat(row.unit_cost)
  };
}

export async function getPurchaseItems(purchaseId: string, client?: PoolClient): Promise<PurchaseItem[]> {
  const sql = `
    SELECT id, purchase_id, product_id, quantity, received_quantity, unit_cost, created_at
    FROM purchase_items
    WHERE purchase_id = $1
  `;
  const executor = client || pool;
  const result = await executor.query(sql, [purchaseId]);
  return result.rows.map(row => ({
    ...row,
    unit_cost: parseFloat(row.unit_cost)
  }));
}

export async function getPurchaseItemForUpdate(
  purchaseId: string,
  productId: string,
  client: PoolClient
): Promise<PurchaseItem | null> {
  const sql = `
    SELECT id, purchase_id, product_id, quantity, received_quantity, unit_cost, created_at
    FROM purchase_items
    WHERE purchase_id = $1 AND product_id = $2
    FOR UPDATE
  `;
  const result = await client.query(sql, [purchaseId, productId]);
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...row,
    unit_cost: parseFloat(row.unit_cost)
  };
}

export async function updatePurchaseItemReceivedQuantity(
  itemId: string,
  receivedQuantity: number,
  client: PoolClient
): Promise<void> {
  const sql = `
    UPDATE purchase_items
    SET received_quantity = $2
    WHERE id = $1
  `;
  await client.query(sql, [itemId, receivedQuantity]);
}

// === Goods Receipts Repository ===

export async function createGoodsReceipt(
  input: { receipt_number: string; purchase_id: string; carrier_details?: string | null; created_by?: string | null },
  client?: PoolClient
): Promise<GoodsReceipt> {
  const sql = `
    INSERT INTO goods_receipts (receipt_number, purchase_id, carrier_details, created_by)
    VALUES ($1, $2, $3, $4)
    RETURNING id, receipt_number, purchase_id, status, received_date, carrier_details, created_by, created_at, updated_at
  `;
  const executor = client || pool;
  const params = [
    input.receipt_number,
    input.purchase_id,
    input.carrier_details || null,
    input.created_by || null
  ];
  const result = await executor.query(sql, params);
  return result.rows[0];
}

export async function getGoodsReceiptById(id: string, client?: PoolClient): Promise<GoodsReceipt | null> {
  const sql = `
    SELECT id, receipt_number, purchase_id, status, received_date, carrier_details, created_by, created_at, updated_at
    FROM goods_receipts
    WHERE id = $1
  `;
  const executor = client || pool;
  const result = await executor.query(sql, [id]);
  return result.rows[0] || null;
}

export async function getGoodsReceiptByIdForUpdate(id: string, client: PoolClient): Promise<GoodsReceipt | null> {
  const sql = `
    SELECT id, receipt_number, purchase_id, status, received_date, carrier_details, created_by, created_at, updated_at
    FROM goods_receipts
    WHERE id = $1
    FOR UPDATE
  `;
  const result = await client.query(sql, [id]);
  return result.rows[0] || null;
}

export async function updateGoodsReceiptStatus(
  id: string,
  status: GoodsReceiptStatus,
  client: PoolClient
): Promise<GoodsReceipt | null> {
  const sql = `
    UPDATE goods_receipts
    SET status = $2, updated_at = NOW()
    WHERE id = $1
    RETURNING id, receipt_number, purchase_id, status, received_date, carrier_details, created_by, created_at, updated_at
  `;
  const result = await client.query(sql, [id, status]);
  return result.rows[0] || null;
}

export async function getGoodsReceipts(
  filters?: { purchaseId?: string; status?: GoodsReceiptStatus },
  client?: PoolClient
): Promise<GoodsReceipt[]> {
  let sql = `
    SELECT id, receipt_number, purchase_id, status, received_date, carrier_details, created_by, created_at, updated_at
    FROM goods_receipts
  `;
  const conditions: string[] = [];
  const params: any[] = [];

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
  sql += " ORDER BY created_at DESC";

  const executor = client || pool;
  const result = await executor.query(sql, params);
  return result.rows;
}

// === Goods Receipt Items Repository ===

export async function createGoodsReceiptItem(
  input: CreateGoodsReceiptItemInput,
  client?: PoolClient
): Promise<GoodsReceiptItem> {
  const sql = `
    INSERT INTO goods_receipt_items (goods_receipt_id, product_id, quantity)
    VALUES ($1, $2, $3)
    RETURNING id, goods_receipt_id, product_id, quantity, created_at
  `;
  const executor = client || pool;
  const params = [
    input.goods_receipt_id,
    input.product_id,
    input.quantity
  ];
  const result = await executor.query(sql, params);
  return result.rows[0];
}

export async function getGoodsReceiptItems(
  goodsReceiptId: string,
  client?: PoolClient
): Promise<GoodsReceiptItem[]> {
  const sql = `
    SELECT id, goods_receipt_id, product_id, quantity, created_at
    FROM goods_receipt_items
    WHERE goods_receipt_id = $1
  `;
  const executor = client || pool;
  const result = await executor.query(sql, [goodsReceiptId]);
  return result.rows;
}
