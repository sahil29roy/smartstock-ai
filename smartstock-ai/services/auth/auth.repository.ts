import { query } from "@/lib/db";
import { User, UserRole } from "@/types/auth/auth.types";



export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await query<User>(
    "SELECT id, name, email, password_hash, role, is_active, created_at, updated_at FROM users WHERE email = $1",
    [email]
  );
  return result.rows[0] || null;
}


export async function getUserById(id: string): Promise<User | null> {
  const result = await query<User>(
    "SELECT id, name, email, password_hash, role, is_active, created_at, updated_at FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
}


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
