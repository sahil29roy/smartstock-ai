import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as inventoryService from "@/services/inventory/inventory.service";
import { adjustInventoryApiSchema } from "@/validators/inventory/inventory.validator";
import { handleRouteError } from "@/lib/errors";

export const PATCH = withAuth(
  withRoles(["ADMIN", "WAREHOUSE", "MANAGER"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { productId } = params;

      const body = await request.json();
      const parseResult = adjustInventoryApiSchema.safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parseResult.error.format() },
          { status: 400 }
        );
      }

      const { location, reserved_change } = parseResult.data;

      let inventory = await inventoryService.getInventoryByProductId(productId);

      if (location !== undefined) {
        inventory = await inventoryService.updateInventoryLocation(productId, location);
      }

      if (reserved_change !== undefined) {
        inventory = await inventoryService.adjustReservedStock(productId, reserved_change);
      }

      return NextResponse.json({ success: true, inventory });
    } catch (error: any) {
      return handleRouteError(error, `PATCH /api/inventory/:productId`);
    }
  })
);
