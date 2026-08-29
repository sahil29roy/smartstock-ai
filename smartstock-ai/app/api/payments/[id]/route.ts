import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as paymentService from "@/services/payment/payment.service";
import { handleRouteError } from "@/lib/errors";

export const GET = withAuth(
  withRoles(["ADMIN", "SALES", "ACCOUNTS"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { id } = params;

      const payment = await paymentService.getPaymentById(id);
      if (!payment) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, payment });
    } catch (error: any) {
      return handleRouteError(error, "GET /api/payments/:id");
    }
  })
);
