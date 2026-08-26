import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as procurementService from "@/services/procurement/procurement.service";

export const GET = withAuth(
  withRoles(["ADMIN", "ACCOUNTS", "WAREHOUSE"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { id } = params;

      const receipt = await procurementService.getGoodsReceiptById(id);
      if (!receipt) {
        return NextResponse.json({ error: "Goods receipt not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, goodsReceipt: receipt });
    } catch (error: any) {
      console.error("GET /api/goods-receipts/:id error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);

export const DELETE = withAuth(
  withRoles(["ADMIN", "WAREHOUSE"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { id } = params;
      const userId = request.user?.id;

      const cancelled = await procurementService.cancelGoodsReceipt(id, userId);
      return NextResponse.json({ success: true, goodsReceipt: cancelled });
    } catch (error: any) {
      console.error("DELETE /api/goods-receipts/:id error:", error);
      if (
        error.message.includes("not found") ||
        error.message.includes("already cancelled") ||
        error.message.includes("status")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);
