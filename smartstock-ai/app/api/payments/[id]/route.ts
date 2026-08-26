import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as paymentService from "@/services/payment/payment.service";

export const GET = withAuth(
  withRoles(["ADMIN", "ACCOUNTS"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { id } = params;

      const payment = await paymentService.getPaymentById(id);
      if (!payment) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, payment });
    } catch (error: any) {
      console.error("GET /api/payments/:id error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);
