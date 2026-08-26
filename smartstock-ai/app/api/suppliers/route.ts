import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as procurementService from "@/services/procurement/procurement.service";

export const POST = withAuth(
  withRoles(["ADMIN", "ACCOUNTS"], async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const createdBy = request.user?.id;

      const supplier = await procurementService.createSupplier({
        ...body,
        created_by: createdBy
      });

      return NextResponse.json({ success: true, supplier }, { status: 201 });
    } catch (error: any) {
      console.error("POST /api/suppliers error:", error);
      if (error.name === "ZodError") {
        return NextResponse.json(
          { error: "Validation failed", details: error.format() },
          { status: 400 }
        );
      }
      if (error.message.includes("already exists") || error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);

export const GET = withAuth(
  withRoles(["ADMIN", "ACCOUNTS", "WAREHOUSE"], async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const search = searchParams.get("search") || undefined;
      const activeOnly = searchParams.get("activeOnly") === "true";

      const suppliers = await procurementService.getSuppliers({ search, activeOnly });
      return NextResponse.json({ success: true, suppliers });
    } catch (error: any) {
      console.error("GET /api/suppliers error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);
