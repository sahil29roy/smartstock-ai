import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as inventoryService from "@/services/inventory/inventory.service";

export const PATCH = withAuth(
  withRoles(["ADMIN", "WAREHOUSE"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { productId } = params;

      const body = await request.json();
      const { location, reserved_change } = body;

      let inventory = await inventoryService.getInventoryByProductId(productId);

      if (location !== undefined) {
        if (location !== null && (typeof location !== "string" || location.length > 100)) {
          return NextResponse.json({ error: "Location must be a string up to 100 characters" }, { status: 400 });
        }
        inventory = await inventoryService.updateInventoryLocation(productId, location);
      }

      if (reserved_change !== undefined) {
        if (typeof reserved_change !== "number" || !Number.isInteger(reserved_change)) {
          return NextResponse.json({ error: "reserved_change must be an integer" }, { status: 400 });
        }
        inventory = await inventoryService.adjustReservedStock(productId, reserved_change);
      }

      return NextResponse.json({ success: true, inventory });
    } catch (error: any) {
      console.error("PATCH /api/inventory/:productId error:", error);
      if (error.message.includes("Reserved quantity") || error.message.includes("exceed")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);
