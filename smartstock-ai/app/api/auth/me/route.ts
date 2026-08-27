import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { handleRouteError } from "@/lib/errors";

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    return NextResponse.json({
      success: true,
      user: request.user,
    });
  } catch (error: any) {
    return handleRouteError(error, "GET /api/auth/me");
  }
});
