import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as customerService from "@/services/customer/customer.service";
import { updateCustomerSchema } from "@/validators/customer/customer.validator";
import { handleRouteError } from "@/lib/errors";

export const GET = withAuth(
  withRoles(["ADMIN", "SALES", "ACCOUNTS", "WAREHOUSE"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { id } = params;

      const customer = await customerService.getCustomerById(id);
      return NextResponse.json({ success: true, customer });
    } catch (error: any) {
      return handleRouteError(error, "GET /api/customers/:id");
    }
  })
);

export const PATCH = withAuth(
  withRoles(["ADMIN", "SALES"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { id } = params;

      const body = await request.json();
      const parsed = updateCustomerSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.format() },
          { status: 400 }
        );
      }

      const customer = await customerService.updateCustomer(id, parsed.data);
      return NextResponse.json({ success: true, customer });
    } catch (error: any) {
      return handleRouteError(error, "PATCH /api/customers/:id");
    }
  })
);

export const DELETE = withAuth(
  withRoles(["ADMIN", "SALES"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { id } = params;

      await customerService.deleteCustomer(id);
      return NextResponse.json({ success: true, message: "Customer soft-deleted successfully" });
    } catch (error: any) {
      return handleRouteError(error, "DELETE /api/customers/:id");
    }
  })
);
