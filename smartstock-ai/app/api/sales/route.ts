import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as salesService from "@/services/sales/sales.service";
import { createSaleSchema } from "@/validators/sales/sales.validator";
import { z } from "zod";

const createSaleBodySchema = createSaleSchema.extend({
  items: z.array(
    z.object({
      product_id: z.string().uuid("Product ID must be a valid UUID"),
      quantity: z.number().int().positive("Quantity must be a positive integer"),
      unit_price: z.number().nonnegative("Unit price cannot be negative"),
    })
  ).min(1, "At least one item is required"),
});

export const POST = withAuth(
  withRoles(["ADMIN", "SALES"], async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      
      const parseResult = createSaleBodySchema.safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parseResult.error.format() },
          { status: 400 }
        );
      }

      const { customer_id, status, items } = parseResult.data;
      const createdBy = request.user?.id;

      const sale = await salesService.createSale(
        { customer_id, status, created_by: createdBy },
        items
      );

      return NextResponse.json({ success: true, sale }, { status: 201 });
    } catch (error: any) {
      console.error("POST /api/sales error:", error);
      if (
        error.message.includes("Insufficient stock") ||
        error.message.includes("not found") ||
        error.message.includes("inactive")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);

export const GET = withAuth(
  withRoles(["ADMIN", "SALES", "ACCOUNTS"], async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const customerId = searchParams.get("customerId") || undefined;
      const status = (searchParams.get("status") as any) || undefined;

      const sales = await salesService.getSales({ customerId, status });
      return NextResponse.json({ success: true, sales });
    } catch (error: any) {
      console.error("GET /api/sales error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);
