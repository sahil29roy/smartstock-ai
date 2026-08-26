import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as procurementService from "@/services/procurement/procurement.service";

export const POST = withAuth(
  withRoles(["ADMIN", "ACCOUNTS"], async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const createdBy = request.user?.id;

      const purchase = await procurementService.createPurchase({
        ...body,
        created_by: createdBy
      });

      return NextResponse.json({ success: true, purchase }, { status: 201 });
    } catch (error: any) {
      console.error("POST /api/purchases error:", error);
      if (error.name === "ZodError") {
        return NextResponse.json(
          { error: "Validation failed", details: error.format() },
          { status: 400 }
        );
      }
      if (error.message.includes("not found") || error.message.includes("inactive")) {
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
      const supplierId = searchParams.get("supplierId") || undefined;
      const status = (searchParams.get("status") as any) || undefined;

      const purchases = await procurementService.getPurchases({ supplierId, status });
      return NextResponse.json({ success: true, purchases });
    } catch (error: any) {
      console.error("GET /api/purchases error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);
