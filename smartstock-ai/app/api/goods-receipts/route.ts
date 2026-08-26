import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as procurementService from "@/services/procurement/procurement.service";

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
      console.error("POST /api/goods-receipts error:", error);
      if (error.name === "ZodError") {
        return NextResponse.json(
          { error: "Validation failed", details: error.format() },
          { status: 400 }
        );
      }
      if (
        error.message.includes("not found") ||
        error.message.includes("Cannot receive") ||
        error.message.includes("Remaining allowed") ||
        error.message.includes("status") ||
        error.message.includes("not part of")
      ) {
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
      const purchaseId = searchParams.get("purchaseId") || undefined;
      const status = (searchParams.get("status") as any) || undefined;

      const goodsReceipts = await procurementService.getGoodsReceipts({ purchaseId, status });
      return NextResponse.json({ success: true, goodsReceipts });
    } catch (error: any) {
      console.error("GET /api/goods-receipts error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);
