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

export interface JWTPayload {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthSession {
  user: Omit<User, "password_hash">;
  token: string;
}
