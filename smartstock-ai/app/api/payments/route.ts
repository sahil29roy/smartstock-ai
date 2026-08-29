import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as paymentService from "@/services/payment/payment.service";
import * as procurementService from "@/services/procurement/procurement.service";
import { createPaymentSchema } from "@/validators/payment/payment.validator";
import { handleRouteError } from "@/lib/errors";

export const POST = withAuth(
  withRoles(["ADMIN", "ACCOUNTS"], async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();

      const parseResult = createPaymentSchema.safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parseResult.error.format() },
          { status: 400 }
        );
      }

      const createdBy = request.user?.id;
      let payment;

      if (parseResult.data.purchase_id) {
        payment = await procurementService.createSupplierPayment({
          ...parseResult.data,
          created_by: createdBy
        });
      } else {
        payment = await paymentService.createPayment({
          ...parseResult.data,
          created_by: createdBy
        });
      }

      return NextResponse.json({ success: true, payment }, { status: 201 });
    } catch (error: any) {
      return handleRouteError(error, "POST /api/payments");
    }
  })
);

export const GET = withAuth(
  withRoles(["ADMIN", "SALES", "ACCOUNTS"], async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const saleId = searchParams.get("saleId") || undefined;
      const purchaseId = searchParams.get("purchaseId") || undefined;
      const status = searchParams.get("status") || undefined;

      const payments = await paymentService.getPayments({ saleId, purchaseId, status });
      return NextResponse.json({ success: true, payments });
    } catch (error: any) {
      return handleRouteError(error, "GET /api/payments");
    }
  })
);
