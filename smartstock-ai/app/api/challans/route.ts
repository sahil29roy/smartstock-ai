import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as challanService from "@/services/challan/challan.service";
import { createChallanSchema } from "@/validators/challan/challan.validator";
import { z } from "zod";

const challanItemBodySchema = z.object({
  product_id: z.string().uuid("Product ID must be a valid UUID"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

const createChallanBodySchema = createChallanSchema.extend({
  items: z.array(challanItemBodySchema).min(1, "At least one item is required"),
});

export const POST = withAuth(
  withRoles(["ADMIN", "WAREHOUSE"], async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();

      const parseResult = createChallanBodySchema.safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parseResult.error.format() },
          { status: 400 }
        );
      }

      const { challan_number, sale_id, status, dispatch_date, carrier_details, items } = parseResult.data;
      const createdBy = request.user?.id;

      const challan = await challanService.createChallan(
        {
          challan_number,
          sale_id,
          status,
          dispatch_date: dispatch_date ? new Date(dispatch_date) : undefined,
          carrier_details,
          created_by: createdBy
        },
        items
      );

      return NextResponse.json({ success: true, challan }, { status: 201 });
    } catch (error: any) {
      console.error("POST /api/challans error:", error);
      if (
        error.message.includes("Insufficient") ||
        error.message.includes("not found") ||
        error.message.includes("exceeding") ||
        error.message.includes("already exists") ||
        error.message.includes("cancelled")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);

export const GET = withAuth(
  withRoles(["ADMIN", "WAREHOUSE", "SALES"], async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const saleId = searchParams.get("saleId") || undefined;
      const status = (searchParams.get("status") as any) || undefined;

      const challans = await challanService.getChallans({ saleId, status });
      return NextResponse.json({ success: true, challans });
    } catch (error: any) {
      console.error("GET /api/challans error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);
