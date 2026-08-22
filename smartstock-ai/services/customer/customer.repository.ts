import { query } from "@/lib/db";
import { Customer, CreateCustomerInput, UpdateCustomerInput } from "@/types/customer/customer.types";


export async function getCustomerById(id: string, includeDeleted: boolean = false): Promise<Customer | null> {
  const sql = `
    SELECT id, name, email, phone, address, gst_number, notes, created_by, deleted_at, created_at, updated_at
    FROM customers
    WHERE id = $1 ${includeDeleted ? "" : "AND deleted_at IS NULL"}
  `;
  const result = await query<Customer>(sql, [id]);
  return result.rows[0] || null;
}


export async function getCustomers(includeDeleted: boolean = false): Promise<Customer[]> {
  const sql = `
    SELECT id, name, email, phone, address, gst_number, notes, created_by, deleted_at, created_at, updated_at
    FROM customers
    ${includeDeleted ? "" : "WHERE deleted_at IS NULL"}
    ORDER BY name ASC
  `;
  const result = await query<Customer>(sql);
  return result.rows;
}


export async function getCustomerByEmail(email: string, includeDeleted: boolean = false): Promise<Customer | null> {
  const sql = `
    SELECT id, name, email, phone, address, gst_number, notes, created_by, deleted_at, created_at, updated_at
    FROM customers
    WHERE email = $1 ${includeDeleted ? "" : "AND deleted_at IS NULL"}
  `;
  const result = await query<Customer>(sql, [email]);
  return result.rows[0] || null;
}


export async function getCustomerByPhone(phone: string, includeDeleted: boolean = false): Promise<Customer | null> {
  const sql = `
    SELECT id, name, email, phone, address, gst_number, notes, created_by, deleted_at, created_at, updated_at
    FROM customers
    WHERE phone = $1 ${includeDeleted ? "" : "AND deleted_at IS NULL"}
  `;
  const result = await query<Customer>(sql, [phone]);
  return result.rows[0] || null;
}


export async function getCustomerByGstNumber(gstNumber: string, includeDeleted: boolean = false): Promise<Customer | null> {
  const sql = `
    SELECT id, name, email, phone, address, gst_number, notes, created_by, deleted_at, created_at, updated_at
    FROM customers
    WHERE gst_number = $1 ${includeDeleted ? "" : "AND deleted_at IS NULL"}
  `;
  const result = await query<Customer>(sql, [gstNumber]);
  return result.rows[0] || null;
}


export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const sql = `
    INSERT INTO customers (name, email, phone, address, gst_number, notes, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, name, email, phone, address, gst_number, notes, created_by, deleted_at, created_at, updated_at
  `;
  const values = [
    input.name,
    input.email,
    input.phone ?? null,
    input.address ?? null,
    input.gst_number ?? null,
    input.notes ?? null,
    input.created_by ?? null,
  ];
  const result = await query<Customer>(sql, values);
  return result.rows[0];
}


export async function updateCustomer(id: string, input: UpdateCustomerInput): Promise<Customer | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  Object.entries(input).forEach(([key, val]) => {
    if (val !== undefined) {
      fields.push(`${key} = $${index}`);
      values.push(val);
      index++;
    }
  });

  if (fields.length === 0) {
    return getCustomerById(id);
  }

  fields.push(`updated_at = now()`);
  values.push(id);

  const sql = `
    UPDATE customers
    SET ${fields.join(", ")}
    WHERE id = $${index} AND deleted_at IS NULL
    RETURNING id, name, email, phone, address, gst_number, notes, created_by, deleted_at, created_at, updated_at
  `;

  const result = await query<Customer>(sql, values);
  return result.rows[0] || null;
}


export async function softDeleteCustomer(id: string): Promise<boolean> {
  const sql = `
    UPDATE customers
    SET deleted_at = now(), updated_at = now()
    WHERE id = $1 AND deleted_at IS NULL
  `;
  const result = await query(sql, [id]);
  return (result.rowCount ?? 0) > 0;
}


export async function restoreCustomer(id: string): Promise<boolean> {
  const sql = `
    UPDATE customers
    SET deleted_at = NULL, updated_at = now()
    WHERE id = $1 AND deleted_at IS NOT NULL
  `;
  const result = await query(sql, [id]);
  return (result.rowCount ?? 0) > 0;
}
