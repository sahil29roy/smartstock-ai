import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as categoryService from "@/services/category/category.service";
import { createCategorySchema } from "@/validators/category/category.validator";
import { handleRouteError } from "@/lib/errors";

export const GET = withAuth(
  withRoles(["ADMIN", "WAREHOUSE", "SALES", "ACCOUNTS", "MANAGER"], async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const includeDeleted = searchParams.get("includeDeleted") === "true";

      const categories = await categoryService.getCategories(includeDeleted);
      return NextResponse.json({ success: true, categories });
    } catch (error: any) {
      return handleRouteError(error, "GET /api/categories");
    }
  })
);

export const POST = withAuth(
  withRoles(["ADMIN", "WAREHOUSE", "MANAGER"], async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();

      const parsed = createCategorySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.format() },
          { status: 400 }
        );
      }

      const categoryInput = {
        ...parsed.data,
        created_by: request.user.id,
      };

      const category = await categoryService.createCategory(categoryInput);
      return NextResponse.json({ success: true, category }, { status: 201 });
    } catch (error: any) {
      return handleRouteError(error, "POST /api/categories");
    }
  })
);
