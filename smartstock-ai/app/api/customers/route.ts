import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import * as customerService from "@/services/customer/customer.service";
import { createCustomerSchema } from "@/validators/customer/customer.validator";

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get("includeDeleted") === "true";
    
    const customers = await customerService.getCustomers(includeDeleted);
    return NextResponse.json({ success: true, customers });
  } catch (error: any) {
    console.error("GET /api/customers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    
    const parsed = createCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const customerInput = {
      ...parsed.data,
      created_by: request.user.id,
    };

    const customer = await customerService.createCustomer(customerInput);
    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/customers error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message?.includes("already exists") ? 400 : 500 }
    );
  }
});
