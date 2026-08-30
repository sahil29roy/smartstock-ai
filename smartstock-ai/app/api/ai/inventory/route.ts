import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as aiService from "@/services/ai/ai.service";
import { handleRouteError } from "@/lib/errors";

export const GET = withAuth(
  withRoles(["ADMIN", "MANAGER", "WAREHOUSE"], async (request: AuthenticatedRequest) => {
    try {
      const role = request.user.role;
      const userId = request.user.id;
      const data = await aiService.generateInventoryInsights(role, userId);

      return NextResponse.json({ success: true, insights: data });
    } catch (error) {
      return handleRouteError(error, "GET /api/ai/inventory");
    }
  })
);
