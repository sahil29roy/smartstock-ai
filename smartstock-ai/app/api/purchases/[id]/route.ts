import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as procurementService from "@/services/procurement/procurement.service";
import { updatePurchaseSchema } from "@/validators/procurement/procurement.validator";
import { handleRouteError } from "@/lib/errors";

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
      return handleRouteError(error, "GET /api/purchases/:id");
    }
  })
);

export const PATCH = withAuth(
  withRoles(["ADMIN", "ACCOUNTS"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { id } = params;

      const body = await request.json();
      const parseResult = updatePurchaseSchema.pick({ status: true }).safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parseResult.error.format() },
          { status: 400 }
        );
      }

      const { status } = parseResult.data;
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
      return handleRouteError(error, "PATCH /api/purchases/:id");
    }
  })
);
