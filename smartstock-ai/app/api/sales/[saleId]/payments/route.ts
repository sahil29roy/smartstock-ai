import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as salesService from "@/services/sales/sales.service";
import { createPaymentSchema } from "@/validators/sales/sales.validator";

// Schema for payment request body (without sale_id, which comes from the route param)
const paymentBodySchema = createPaymentSchema.omit({ sale_id: true, created_by: true });

export const POST = withAuth(
  withRoles(["ADMIN", "ACCOUNTS"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { saleId } = params;

      const body = await request.json();
      const parseResult = paymentBodySchema.safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parseResult.error.format() },
          { status: 400 }
        );
      }

      const { amount, payment_method, status } = parseResult.data;
      const createdBy = request.user?.id;

      const payment = await salesService.createPayment({
        sale_id: saleId,
        amount,
        payment_method,
        status,
        created_by: createdBy
      });

      return NextResponse.json({ success: true, payment }, { status: 201 });
    } catch (error: any) {
      console.error("POST /api/sales/:saleId/payments error:", error);
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);

export const GET = withAuth(
  withRoles(["ADMIN", "SALES", "ACCOUNTS"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { saleId } = params;

      const payments = await salesService.getPaymentsBySaleId(saleId);
      return NextResponse.json({ success: true, payments });
    } catch (error: any) {
      console.error("GET /api/sales/:saleId/payments error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);
