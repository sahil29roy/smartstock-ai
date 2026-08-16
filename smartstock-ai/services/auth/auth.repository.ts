import { query } from "@/lib/db";

export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Find a user by their email address.
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await query<User>(
    "SELECT id, name, email, password_hash, role, is_active, created_at, updated_at FROM users WHERE email = $1",
    [email]
  );
  return result.rows[0] || null;
}

/**
 * Find a user by their ID.
 */
export async function getUserById(id: string): Promise<User | null> {
  const result = await query<User>(
    "SELECT id, name, email, password_hash, role, is_active, created_at, updated_at FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Create a new user in the database.
 */
export async function createUser(
  name: string,
  email: string,
  passwordHash: string,
  role: UserRole
): Promise<User> {
  const result = await query<User>(
    `INSERT INTO users (name, email, password_hash, role) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, name, email, password_hash, role, is_active, created_at, updated_at`,
    [name, email, passwordHash, role]
  );
  return result.rows[0];
}
