import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as reportsService from "@/services/reports/reports.service";
import { financialReportQuerySchema } from "@/validators/reports/reports.validator";

export const GET = withAuth(
  withRoles(["ADMIN", "ACCOUNTS"], async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const queryParams = Object.fromEntries(searchParams.entries());

      const parseResult = financialReportQuerySchema.safeParse(queryParams);
      if (!parseResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parseResult.error.format() },
          { status: 400 }
        );
      }

      const data = await reportsService.getFinancialReport(parseResult.data);
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      console.error("GET /api/reports/payments error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);
