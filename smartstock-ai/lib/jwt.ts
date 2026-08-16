import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_change_me";

/**
 * Signs a payload to generate a JWT.
 */
export function signToken(payload: object, expiresIn: string | number = "1d"): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
}

/**
 * Verifies and decodes a JWT token. Returns null if invalid or expired.
 */
export function verifyToken<T extends object>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch (error) {
    return null;
  }
}
