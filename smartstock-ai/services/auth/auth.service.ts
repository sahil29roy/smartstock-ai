import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getUserByEmail, User } from "./auth.repository";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_change_me";
const TOKEN_EXPIRY = "1d"; // 24 hours

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

  const isMatch = await bcrypt.compare(passwordPlain, user.password_hash);
  if (!isMatch) {
    return null;
  }

  const payload: JWTPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

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
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}
