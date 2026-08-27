import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as procurementService from "@/services/procurement/procurement.service";
import { handleRouteError } from "@/lib/errors";

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
      return handleRouteError(error, "POST /api/suppliers");
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
      return handleRouteError(error, "GET /api/suppliers");
    }
  })
);
