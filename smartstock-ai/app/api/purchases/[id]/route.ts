import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as procurementService from "@/services/procurement/procurement.service";

export const GET = withAuth(
  withRoles(["ADMIN", "ACCOUNTS", "WAREHOUSE"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { id } = params;

      const purchase = await procurementService.getPurchaseById(id);
      if (!purchase) {
        return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, purchase });
    } catch (error: any) {
      console.error("GET /api/purchases/:id error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);

export const PATCH = withAuth(
  withRoles(["ADMIN", "ACCOUNTS"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { id } = params;

      const body = await request.json();
      const { status } = body;

      if (!status) {
        return NextResponse.json({ error: "status is required to patch purchase order" }, { status: 400 });
      }

      // Role-based restrictions on status transition: Only ADMIN can cancel a PO
      if (status === "CANCELLED" && request.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Only admin can cancel purchase orders" }, { status: 403 });
      }

      const updated = await procurementService.updatePurchaseStatus(id, status);
      return NextResponse.json({ success: true, purchase: updated });
    } catch (error: any) {
      console.error("PATCH /api/purchases/:id error:", error);
      if (
        error.message.includes("not found") ||
        error.message.includes("Cannot cancel") ||
        error.message.includes("status")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);
