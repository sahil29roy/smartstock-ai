import { comparePassword } from "@/lib/password";
import { signToken, verifyToken as jwtVerifyToken } from "@/lib/jwt";
import { getUserByEmail, User } from "./auth.repository";

export interface JWTPayload {
  userId: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthSession {
  user: Omit<User, "password_hash">;
  token: string;
}

/**
 * Authenticates a user by email and password.
 * Returns the user details (without password hash) and a signed JWT token, or null if invalid.
 */
export async function login(email: string, passwordPlain: string): Promise<AuthSession | null> {
  const user = await getUserByEmail(email);
  
  if (!user || !user.is_active) {
    return null;
  }

  const isMatch = await comparePassword(passwordPlain, user.password_hash);
  if (!isMatch) {
    return null;
  }

  const payload: JWTPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const token = signToken(payload);

  const { password_hash, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
  };
}

/**
 * Verifies a JWT token and returns its decoded payload, or null if invalid.
 */
export function verifyToken(token: string): JWTPayload | null {
  return jwtVerifyToken<JWTPayload>(token);
}
