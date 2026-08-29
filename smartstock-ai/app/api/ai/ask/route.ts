import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as aiService from "@/services/ai/ai.service";
import { askAIRequestSchema } from "@/validators/ai/ai.validator";
import { handleRouteError } from "@/lib/errors";

export const POST = withAuth(
  withRoles(["ADMIN", "MANAGER", "SALES", "WAREHOUSE", "ACCOUNTS"], async (request: AuthenticatedRequest) => {
    try {
      let body;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON body" },
          { status: 400 }
        );
      }

      const parseResult = askAIRequestSchema.safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parseResult.error.format() },
          { status: 400 }
        );
      }

      const role = request.user.role;
      const userId = request.user.userId;
      const data = await aiService.askSmartStock(role, userId, parseResult.data.question);

      return NextResponse.json({ success: true, response: data });
    } catch (error) {
      return handleRouteError(error, "POST /api/ai/ask");
    }
  })
);
