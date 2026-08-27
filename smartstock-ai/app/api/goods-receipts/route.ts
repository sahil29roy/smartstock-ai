import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as procurementService from "@/services/procurement/procurement.service";
import { handleRouteError } from "@/lib/errors";

export const POST = withAuth(
  withRoles(["ADMIN", "WAREHOUSE"], async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const createdBy = request.user?.id;

      const receipt = await procurementService.createGoodsReceipt({
        ...body,
        created_by: createdBy
      });

      return NextResponse.json({ success: true, goodsReceipt: receipt }, { status: 201 });
    } catch (error: any) {
      return handleRouteError(error, "POST /api/goods-receipts");
    }
  })
);

export const GET = withAuth(
  withRoles(["ADMIN", "ACCOUNTS", "WAREHOUSE"], async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const purchaseId = searchParams.get("purchaseId") || undefined;
      const status = (searchParams.get("status") as any) || undefined;

      const goodsReceipts = await procurementService.getGoodsReceipts({ purchaseId, status });
      return NextResponse.json({ success: true, goodsReceipts });
    } catch (error: any) {
      return handleRouteError(error, "GET /api/goods-receipts");
    }
  })
);
