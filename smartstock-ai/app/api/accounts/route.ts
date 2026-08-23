import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as accountsService from "@/services/accounts/accounts.service";
import { createAccountSchema } from "@/validators/accounts/accounts.validator";

export const POST = withAuth(
  withRoles(["ADMIN", "ACCOUNTS"], async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const parseResult = createAccountSchema.safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parseResult.error.format() },
          { status: 400 }
        );
      }

      const createdBy = request.user?.id;
      const account = await accountsService.createAccount({
        ...parseResult.data,
        created_by: createdBy
      });

      return NextResponse.json({ success: true, account }, { status: 201 });
    } catch (error: any) {
      console.error("POST /api/accounts error:", error);
      if (error.message.includes("already exists")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);

export const GET = withAuth(
  withRoles(["ADMIN", "SALES", "ACCOUNTS"], async (request: AuthenticatedRequest) => {
    try {
      const accounts = await accountsService.listAccounts();
      return NextResponse.json({ success: true, accounts });
    } catch (error: any) {
      console.error("GET /api/accounts error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);
