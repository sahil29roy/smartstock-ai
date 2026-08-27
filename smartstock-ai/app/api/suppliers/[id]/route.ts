import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as procurementService from "@/services/procurement/procurement.service";
import { handleRouteError } from "@/lib/errors";

export const GET = withAuth(
  withRoles(["ADMIN", "ACCOUNTS", "WAREHOUSE"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { id } = params;

      const supplier = await procurementService.getSupplierById(id);
      if (!supplier) {
        return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, supplier });
    } catch (error: any) {
      return handleRouteError(error, "GET /api/suppliers/:id");
    }
  })
);

export const PUT = withAuth(
  withRoles(["ADMIN", "ACCOUNTS"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { id } = params;

      const body = await request.json();
      const updated = await procurementService.updateSupplier(id, body);

      return NextResponse.json({ success: true, supplier: updated });
    } catch (error: any) {
      return handleRouteError(error, "PUT /api/suppliers/:id");
    }
  })
);

export const DELETE = withAuth(
  withRoles(["ADMIN"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { id } = params;

      const deleted = await procurementService.deleteSupplier(id);
      return NextResponse.json({ success: true, supplier: deleted });
    } catch (error: any) {
      return handleRouteError(error, "DELETE /api/suppliers/:id");
    }
  })
);
