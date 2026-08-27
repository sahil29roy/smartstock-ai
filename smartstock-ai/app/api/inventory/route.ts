import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as inventoryService from "@/services/inventory/inventory.service";
import { handleRouteError } from "@/lib/errors";

export const GET = withAuth(
  withRoles(["ADMIN", "WAREHOUSE", "SALES", "ACCOUNTS"], async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const productId = searchParams.get("productId");

      if (!productId) {
        return NextResponse.json({ error: "productId query parameter is required" }, { status: 400 });
      }

      const inventory = await inventoryService.getInventoryByProductId(productId);
      return NextResponse.json({ success: true, inventory });
    } catch (error: any) {
      return handleRouteError(error, "GET /api/inventory");
    }
  })
);
