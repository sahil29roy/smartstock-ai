import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as procurementService from "@/services/procurement/procurement.service";

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
      console.error("GET /api/suppliers/:id error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
      console.error("PUT /api/suppliers/:id error:", error);
      if (error.name === "ZodError") {
        return NextResponse.json(
          { error: "Validation failed", details: error.format() },
          { status: 400 }
        );
      }
      if (error.message.includes("not found") || error.message.includes("already exists")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
      console.error("DELETE /api/suppliers/:id error:", error);
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);
