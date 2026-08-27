import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as reportsService from "@/services/reports/reports.service";
import { dashboardSummaryQuerySchema } from "@/validators/reports/reports.validator";
import { handleRouteError } from "@/lib/errors";

export const GET = withAuth(
  withRoles(["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"], async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const queryParams = Object.fromEntries(searchParams.entries());

      const parseResult = dashboardSummaryQuerySchema.safeParse(queryParams);
      if (!parseResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parseResult.error.format() },
          { status: 400 }
        );
      }

      const role = request.user.role;
      const data = await reportsService.getDashboardSummary(parseResult.data, role);

      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      return handleRouteError(error, "GET /api/reports/dashboard");
    }
  })
);
