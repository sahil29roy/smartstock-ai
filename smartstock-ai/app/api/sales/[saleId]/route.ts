import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as salesService from "@/services/sales/sales.service";
import { updateSaleSchema } from "@/validators/sales/sales.validator";

export const GET = withAuth(
  withRoles(["ADMIN", "SALES", "ACCOUNTS"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { saleId } = params;

      const sale = await salesService.getSaleById(saleId);
      if (!sale) {
        return NextResponse.json({ error: "Sale not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, sale });
    } catch (error: any) {
      console.error("GET /api/sales/:saleId error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);

export const PATCH = withAuth(
  withRoles(["ADMIN", "SALES"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { saleId } = params;

      const body = await request.json();
      const parseResult = updateSaleSchema.safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parseResult.error.format() },
          { status: 400 }
        );
      }

      const { status } = parseResult.data;
      if (!status) {
        return NextResponse.json({ error: "status is required to patch sale" }, { status: 400 });
      }

      const updatedSale = await salesService.updateSaleStatus(saleId, status);
      return NextResponse.json({ success: true, sale: updatedSale });
    } catch (error: any) {
      console.error("PATCH /api/sales/:saleId error:", error);
      if (
        error.message.includes("Insufficient stock") ||
        error.message.includes("not found")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);
