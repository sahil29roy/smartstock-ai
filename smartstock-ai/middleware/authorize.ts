import { NextResponse } from "next/server";
import { UserRole } from "@/types/auth/auth.types";
import { AuthenticatedRequest, AuthenticatedHandler } from "./authenticate";


export function withRoles(allowedRoles: UserRole[], handler: AuthenticatedHandler): AuthenticatedHandler {
  return async (request: AuthenticatedRequest, context: any) => {
    try {
      const user = request.user;
      if (!user) {
        return NextResponse.json(
          { error: "Unauthorized: User context missing" },
          { status: 401 }
        );
      }

      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { error: "Forbidden: You do not have permission to access this resource" },
          { status: 403 }
        );
      }

      return await handler(request, context);
    } catch (error) {
      console.error("Authorization middleware error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}
