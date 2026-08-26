import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as challanService from "@/services/challan/challan.service";
import { updateChallanSchema } from "@/validators/challan/challan.validator";

export const GET = withAuth(
  withRoles(["ADMIN", "WAREHOUSE", "SALES"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { id } = params;

      const challan = await challanService.getChallanById(id);
      if (!challan) {
        return NextResponse.json({ error: "Delivery challan not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, challan });
    } catch (error: any) {
      console.error("GET /api/challans/:id error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);

export const PATCH = withAuth(
  withRoles(["ADMIN", "WAREHOUSE"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { id } = params;

      const body = await request.json();
      const parseResult = updateChallanSchema.safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parseResult.error.format() },
          { status: 400 }
        );
      }

      const { status, dispatch_date, carrier_details } = parseResult.data;
      const updatedChallan = await challanService.updateChallan(id, {
        status,
        dispatch_date: dispatch_date ? new Date(dispatch_date) : (dispatch_date === null ? null : undefined),
        carrier_details,
        updated_by: request.user?.id
      });

      return NextResponse.json({ success: true, challan: updatedChallan });
    } catch (error: any) {
      console.error("PATCH /api/challans/:id error:", error);
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (
        error.message.includes("Cannot modify") ||
        error.message.includes("Validation") ||
        error.message.includes("status")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);

export const DELETE = withAuth(
  withRoles(["ADMIN", "WAREHOUSE"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { id } = params;

      const deleted = await challanService.deleteChallan(id, request.user?.id);
      if (!deleted) {
        return NextResponse.json({ error: "Challan not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: "Delivery challan deleted successfully" });
    } catch (error: any) {
      console.error("DELETE /api/challans/:id error:", error);
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);
