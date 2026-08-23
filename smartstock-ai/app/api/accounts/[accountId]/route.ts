import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as accountsService from "@/services/accounts/accounts.service";
import { updateAccountSchema } from "@/validators/accounts/accounts.validator";

export const GET = withAuth(
  withRoles(["ADMIN", "SALES", "ACCOUNTS"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { accountId } = params;

      const account = await accountsService.getAccountById(accountId);
      if (!account) {
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, account });
    } catch (error: any) {
      console.error("GET /api/accounts/:accountId error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);

export const PATCH = withAuth(
  withRoles(["ADMIN", "ACCOUNTS"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { accountId } = params;

      const body = await request.json();
      const parseResult = updateAccountSchema.safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parseResult.error.format() },
          { status: 400 }
        );
      }

      const account = await accountsService.updateAccount(accountId, parseResult.data);
      return NextResponse.json({ success: true, account });
    } catch (error: any) {
      console.error("PATCH /api/accounts/:accountId error:", error);
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("already exists")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);
