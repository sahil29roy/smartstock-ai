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

      const purchase = await procurementService.createPurchase({
        ...body,
        created_by: createdBy
      });

      return NextResponse.json({ success: true, purchase }, { status: 201 });
    } catch (error: any) {
      return handleRouteError(error, "POST /api/purchases");
    }
  })
);

export const GET = withAuth(
  withRoles(["ADMIN", "ACCOUNTS", "WAREHOUSE"], async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const supplierId = searchParams.get("supplierId") || undefined;
      const status = (searchParams.get("status") as any) || undefined;

      const purchases = await procurementService.getPurchases({ supplierId, status });
      return NextResponse.json({ success: true, purchases });
    } catch (error: any) {
      return handleRouteError(error, "GET /api/purchases");
    }
  })
);
