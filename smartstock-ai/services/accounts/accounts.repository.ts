import { pool } from "@/lib/db";
import { PoolClient } from "pg";
import { Account, CreateAccountInput, UpdateAccountInput } from "@/types/accounts/accounts.types";

export async function getAccountById(id: string, client?: PoolClient): Promise<Account | null> {
  const sql = `
    SELECT id, name, type, balance, description, created_by, created_at, updated_at
    FROM accounts
    WHERE id = $1
  `;
  const executor = client || pool;
  const result = await executor.query(sql, [id]);
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...row,
    balance: parseFloat(row.balance)
  };
}

export async function getAccountByIdForUpdate(id: string, client: PoolClient): Promise<Account | null> {
  const sql = `
    SELECT id, name, type, balance, description, created_by, created_at, updated_at
    FROM accounts
    WHERE id = $1
    FOR UPDATE
  `;
  const result = await client.query(sql, [id]);
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...row,
    balance: parseFloat(row.balance)
  };
}

export async function getAccountByName(name: string, client?: PoolClient): Promise<Account | null> {
  const sql = `
    SELECT id, name, type, balance, description, created_by, created_at, updated_at
    FROM accounts
    WHERE name = $1
  `;
  const executor = client || pool;
  const result = await executor.query(sql, [name]);
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...row,
    balance: parseFloat(row.balance)
  };
}

export async function createAccount(
  input: CreateAccountInput,
  client?: PoolClient
): Promise<Account> {
  const sql = `
    INSERT INTO accounts (name, type, balance, description, created_by)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, type, balance, description, created_by, created_at, updated_at
  `;
  const executor = client || pool;
  const values = [
    input.name,
    input.type,
    input.balance ?? 0.00,
    input.description ?? null,
    input.created_by ?? null
  ];
  const result = await executor.query(sql, values);
  const row = result.rows[0];
  return {
    ...row,
    balance: parseFloat(row.balance)
  };
}

export async function updateAccount(
  id: string,
  input: UpdateAccountInput,
  client?: PoolClient
): Promise<Account> {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (input.name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(input.name);
  }
  if (input.type !== undefined) {
    fields.push(`type = $${idx++}`);
    values.push(input.type);
  }
  if (input.balance !== undefined) {
    fields.push(`balance = $${idx++}`);
    values.push(input.balance);
  }
  if (input.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(input.description);
  }

  fields.push(`updated_at = NOW()`);

  values.push(id);
  const sql = `
    UPDATE accounts
    SET ${fields.join(", ")}
    WHERE id = $${idx}
    RETURNING id, name, type, balance, description, created_by, created_at, updated_at
  `;

  const executor = client || pool;
  const result = await executor.query(sql, values);
  const row = result.rows[0];
  return {
    ...row,
    balance: parseFloat(row.balance)
  };
}

export async function updateAccountBalance(
  id: string,
  amount: number,
  client: PoolClient
): Promise<Account> {
  const sql = `
    UPDATE accounts
    SET balance = balance + $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, name, type, balance, description, created_by, created_at, updated_at
  `;
  const result = await client.query(sql, [amount, id]);
  const row = result.rows[0];
  if (!row) {
    throw new Error(`Account with ID ${id} not found`);
  }
  return {
    ...row,
    balance: parseFloat(row.balance)
  };
}

export async function listAccounts(client?: PoolClient): Promise<Account[]> {
  const sql = `
    SELECT id, name, type, balance, description, created_by, created_at, updated_at
    FROM accounts
    ORDER BY name ASC
  `;
  const executor = client || pool;
  const result = await executor.query(sql);
  return result.rows.map(row => ({
    ...row,
    balance: parseFloat(row.balance)
  }));
}
