import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as salesService from "@/services/sales/sales.service";
import { createPaymentSchema } from "@/validators/sales/sales.validator";
import { handleRouteError } from "@/lib/errors";

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

      const { account_id, amount, payment_method, status } = parseResult.data;
      const createdBy = request.user?.id;

      const payment = await salesService.createPayment({
        sale_id: saleId,
        account_id,
        amount,
        payment_method,
        status,
        created_by: createdBy
      });

      return NextResponse.json({ success: true, payment }, { status: 201 });
    } catch (error: any) {
      return handleRouteError(error, "POST /api/sales/:saleId/payments");
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
      return handleRouteError(error, "GET /api/sales/:saleId/payments");
    }
  })
);
