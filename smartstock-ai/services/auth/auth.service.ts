import { comparePassword } from "@/lib/password";
import { signToken, verifyToken as jwtVerifyToken } from "@/lib/jwt";
import { getUserByEmail, getUserById as repoGetUserById } from "./auth.repository";
import { JWTPayload, AuthSession, User } from "@/types/auth/auth.types";




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


export function verifyToken(token: string): JWTPayload | null {
  return jwtVerifyToken<JWTPayload>(token);
}

export async function getUserById(id: string): Promise<User | null> {
  return repoGetUserById(id);
}

