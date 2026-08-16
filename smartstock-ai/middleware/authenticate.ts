import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/services/auth/auth.service";
import { getUserById } from "@/services/auth/auth.repository";
import { User } from "@/types/auth/auth.types";

export interface AuthenticatedRequest extends Request {
  user: Omit<User, "password_hash">;
}

export type AuthenticatedHandler = (
  request: AuthenticatedRequest,
  context: any
) => Promise<NextResponse> | NextResponse;


export function withAuth(handler: AuthenticatedHandler) {
  return async (request: Request, context: any) => {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("token")?.value;

      if (!token) {
        return NextResponse.json(
          { error: "Unauthorized: No token provided" },
          { status: 401 }
        );
      }

      const payload = verifyToken(token);
      if (!payload) {
        return NextResponse.json(
          { error: "Unauthorized: Invalid or expired token" },
          { status: 401 }
        );
      }

      const user = await getUserById(payload.userId);
      if (!user || !user.is_active) {
        return NextResponse.json(
          { error: "Unauthorized: User not found or inactive" },
          { status: 401 }
        );
      }

      const { password_hash, ...userWithoutPassword } = user;

      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = userWithoutPassword;

      return await handler(authenticatedRequest, context);
    } catch (error) {
      console.error("Authentication middleware error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}
