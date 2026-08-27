import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as inventoryService from "@/services/inventory/inventory.service";
import { createStockMovementSchema } from "@/validators/inventory/inventory.validator";
import { handleRouteError } from "@/lib/errors";

export const GET = withAuth(
  withRoles(["ADMIN", "WAREHOUSE", "SALES", "ACCOUNTS"], async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const productId = searchParams.get("productId") || undefined;

      const movements = await inventoryService.getStockMovements(productId);
      return NextResponse.json({ success: true, movements });
    } catch (error: any) {
      return handleRouteError(error, "GET /api/inventory/movements");
    }
  })
);

export const POST = withAuth(
  withRoles(["ADMIN", "WAREHOUSE"], async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();

      const parsed = createStockMovementSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.format() },
          { status: 400 }
        );
      }

      const movementInput = {
        ...parsed.data,
        created_by: request.user.id,
      };

      const movement = await inventoryService.recordStockMovement(movementInput);
      return NextResponse.json({ success: true, movement }, { status: 201 });
    } catch (error: any) {
      return handleRouteError(error, "POST /api/inventory/movements");
    }
  })
);
