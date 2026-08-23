import { pool } from "@/lib/db";
import { PoolClient } from "pg";
import {
  Sale,
  CreateSaleInput,
  UpdateSaleInput,
  SaleItem,
  CreateSaleItemInput,
  Payment,
  CreatePaymentInput,
  UpdatePaymentInput,
  Challan,
  CreateChallanInput,
  UpdateChallanInput,
  ChallanItem,
  CreateChallanItemInput,
  SaleStatus,
  ChallanStatus
} from "@/types/sales/sales.types";

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

// === Sales Repository ===

export async function getSaleById(id: string, client?: PoolClient): Promise<Sale | null> {
  const sql = `
    SELECT id, customer_id, total_amount, status, created_by, created_at, updated_at
    FROM sales
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

export async function getSaleByIdForUpdate(id: string, client: PoolClient): Promise<Sale | null> {
  const sql = `
    SELECT id, customer_id, total_amount, status, created_by, created_at, updated_at
    FROM sales
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

export async function createSale(input: CreateSaleInput, client?: PoolClient): Promise<Sale> {
  const sql = `
    INSERT INTO sales (customer_id, total_amount, status, created_by)
    VALUES ($1, $2, $3, $4)
    RETURNING id, customer_id, total_amount, status, created_by, created_at, updated_at
  `;
  const executor = client || pool;
  const params = [
    input.customer_id,
    input.total_amount !== undefined ? input.total_amount : 0.00,
    input.status || "PENDING",
    input.created_by || null
  ];
  const result = await executor.query(sql, params);
  const row = result.rows[0];
  return {
    ...row,
    total_amount: parseFloat(row.total_amount)
  };
}

export async function updateSale(
  id: string,
  input: UpdateSaleInput,
  client?: PoolClient
): Promise<Sale | null> {
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

  if (setClauses.length === 0) {
    return getSaleById(id, client);
  }

  setClauses.push("updated_at = NOW()");
  const sql = `
    UPDATE sales
    SET ${setClauses.join(", ")}
    WHERE id = $1
    RETURNING id, customer_id, total_amount, status, created_by, created_at, updated_at
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

export async function getSales(filters?: { customerId?: string; status?: SaleStatus }, client?: PoolClient): Promise<Sale[]> {
  let sql = `
    SELECT id, customer_id, total_amount, status, created_by, created_at, updated_at
    FROM sales
  `;
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters?.customerId) {
    params.push(filters.customerId);
    conditions.push(`customer_id = $${params.length}`);
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

// === Sale Items Repository ===

export async function createSaleItem(input: CreateSaleItemInput, client?: PoolClient): Promise<SaleItem> {
  const sql = `
    INSERT INTO sale_items (sale_id, product_id, quantity, unit_price)
    VALUES ($1, $2, $3, $4)
    RETURNING id, sale_id, product_id, quantity, unit_price, created_at
  `;
  const executor = client || pool;
  const params = [
    input.sale_id,
    input.product_id,
    input.quantity,
    input.unit_price
  ];
  const result = await executor.query(sql, params);
  const row = result.rows[0];
  return {
    ...row,
    unit_price: parseFloat(row.unit_price)
  };
}

export async function getSaleItems(saleId: string, client?: PoolClient): Promise<SaleItem[]> {
  const sql = `
    SELECT id, sale_id, product_id, quantity, unit_price, created_at
    FROM sale_items
    WHERE sale_id = $1
  `;
  const executor = client || pool;
  const result = await executor.query(sql, [saleId]);
  return result.rows.map(row => ({
    ...row,
    unit_price: parseFloat(row.unit_price)
  }));
}

// === Payments Repository ===

export async function createPayment(input: CreatePaymentInput & { account_id: string }, client?: PoolClient): Promise<Payment> {
  const sql = `
    INSERT INTO payments (sale_id, account_id, amount, payment_method, status, created_by)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, sale_id, account_id, amount, payment_date, payment_method, status, created_by, created_at, updated_at
  `;
  const executor = client || pool;
  const params = [
    input.sale_id,
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

export async function getPaymentById(id: string, client?: PoolClient): Promise<Payment | null> {
  const sql = `
    SELECT id, sale_id, account_id, amount, payment_date, payment_method, status, created_by, created_at, updated_at
    FROM payments
    WHERE id = $1
  `;
  const executor = client || pool;
  const result = await executor.query(sql, [id]);
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...row,
    amount: parseFloat(row.amount)
  };
}

export async function getPaymentByIdForUpdate(id: string, client: PoolClient): Promise<Payment | null> {
  const sql = `
    SELECT id, sale_id, account_id, amount, payment_date, payment_method, status, created_by, created_at, updated_at
    FROM payments
    WHERE id = $1
    FOR UPDATE
  `;
  const result = await client.query(sql, [id]);
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...row,
    amount: parseFloat(row.amount)
  };
}

export async function updatePaymentStatus(
  id: string,
  input: UpdatePaymentInput,
  client?: PoolClient
): Promise<Payment | null> {
  const sql = `
    UPDATE payments
    SET status = $2, updated_at = NOW()
    WHERE id = $1
    RETURNING id, sale_id, account_id, amount, payment_date, payment_method, status, created_by, created_at, updated_at
  `;
  const executor = client || pool;
  const result = await executor.query(sql, [id, input.status]);
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...row,
    amount: parseFloat(row.amount)
  };
}

export async function getPaymentsBySaleId(saleId: string, client?: PoolClient): Promise<Payment[]> {
  const sql = `
    SELECT id, sale_id, account_id, amount, payment_date, payment_method, status, created_by, created_at, updated_at
    FROM payments
    WHERE sale_id = $1
    ORDER BY payment_date DESC
  `;
  const executor = client || pool;
  const result = await executor.query(sql, [saleId]);
  return result.rows.map(row => ({
    ...row,
    amount: parseFloat(row.amount)
  }));
}

// === Challans Repository ===

export async function getChallanById(id: string, client?: PoolClient): Promise<Challan | null> {
  const sql = `
    SELECT id, challan_number, sale_id, status, dispatch_date, carrier_details, created_by, created_at, updated_at
    FROM challans
    WHERE id = $1
  `;
  const executor = client || pool;
  const result = await executor.query(sql, [id]);
  return result.rows[0] || null;
}

export async function getChallanByNumber(challanNumber: string, client?: PoolClient): Promise<Challan | null> {
  const sql = `
    SELECT id, challan_number, sale_id, status, dispatch_date, carrier_details, created_by, created_at, updated_at
    FROM challans
    WHERE challan_number = $1
  `;
  const executor = client || pool;
  const result = await executor.query(sql, [challanNumber]);
  return result.rows[0] || null;
}

export async function createChallan(input: CreateChallanInput, client?: PoolClient): Promise<Challan> {
  const sql = `
    INSERT INTO challans (challan_number, sale_id, status, dispatch_date, carrier_details, created_by)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, challan_number, sale_id, status, dispatch_date, carrier_details, created_by, created_at, updated_at
  `;
  const executor = client || pool;
  const params = [
    input.challan_number,
    input.sale_id,
    input.status || "PENDING",
    input.dispatch_date || null,
    input.carrier_details || null,
    input.created_by || null
  ];
  const result = await executor.query(sql, params);
  return result.rows[0];
}

export async function updateChallan(
  id: string,
  input: UpdateChallanInput,
  client?: PoolClient
): Promise<Challan | null> {
  const setClauses: string[] = [];
  const params: any[] = [id];

  if (input.status !== undefined) {
    params.push(input.status);
    setClauses.push(`status = $${params.length}`);
  }
  if (input.dispatch_date !== undefined) {
    params.push(input.dispatch_date);
    setClauses.push(`dispatch_date = $${params.length}`);
  }
  if (input.carrier_details !== undefined) {
    params.push(input.carrier_details);
    setClauses.push(`carrier_details = $${params.length}`);
  }

  if (setClauses.length === 0) {
    return getChallanById(id, client);
  }

  setClauses.push("updated_at = NOW()");
  const sql = `
    UPDATE challans
    SET ${setClauses.join(", ")}
    WHERE id = $1
    RETURNING id, challan_number, sale_id, status, dispatch_date, carrier_details, created_by, created_at, updated_at
  `;
  const executor = client || pool;
  const result = await executor.query(sql, params);
  return result.rows[0] || null;
}

export async function getChallans(filters?: { saleId?: string; status?: ChallanStatus }, client?: PoolClient): Promise<Challan[]> {
  let sql = `
    SELECT id, challan_number, sale_id, status, dispatch_date, carrier_details, created_by, created_at, updated_at
    FROM challans
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
  sql += " ORDER BY created_at DESC";

  const executor = client || pool;
  const result = await executor.query(sql, params);
  return result.rows;
}

// === Challan Items Repository ===

export async function createChallanItem(input: CreateChallanItemInput, client?: PoolClient): Promise<ChallanItem> {
  const sql = `
    INSERT INTO challan_items (challan_id, product_id, quantity)
    VALUES ($1, $2, $3)
    RETURNING id, challan_id, product_id, quantity, created_at
  `;
  const executor = client || pool;
  const params = [
    input.challan_id,
    input.product_id,
    input.quantity
  ];
  const result = await executor.query(sql, params);
  return result.rows[0];
}

export async function getChallanItems(challanId: string, client?: PoolClient): Promise<ChallanItem[]> {
  const sql = `
    SELECT id, challan_id, product_id, quantity, created_at
    FROM challan_items
    WHERE challan_id = $1
  `;
  const executor = client || pool;
  const result = await executor.query(sql, [challanId]);
  return result.rows;
}
