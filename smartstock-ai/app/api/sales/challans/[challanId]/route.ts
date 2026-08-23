import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as salesService from "@/services/sales/sales.service";

export const GET = withAuth(
  withRoles(["ADMIN", "WAREHOUSE", "SALES"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { challanId } = params;

      const challan = await salesService.getChallanById(challanId);
      if (!challan) {
        return NextResponse.json({ error: "Delivery challan not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, challan });
    } catch (error: any) {
      console.error("GET /api/sales/challans/:challanId error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);
