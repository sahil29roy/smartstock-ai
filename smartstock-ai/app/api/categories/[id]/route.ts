import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as categoryService from "@/services/category/category.service";
import { updateCategorySchema } from "@/validators/category/category.validator";
import { handleRouteError } from "@/lib/errors";

export const GET = withAuth(
  withRoles(["ADMIN", "WAREHOUSE", "SALES", "ACCOUNTS", "MANAGER"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { id } = params;

      const category = await categoryService.getCategoryById(id);
      return NextResponse.json({ success: true, category });
    } catch (error: any) {
      return handleRouteError(error, "GET /api/categories/:id");
    }
  })
);

export const PATCH = withAuth(
  withRoles(["ADMIN", "WAREHOUSE", "MANAGER"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { id } = params;

      const body = await request.json();

      // Check if this is a restore action
      if (body.action === "restore") {
        const restored = await categoryService.restoreCategory(id);
        if (!restored) {
          return NextResponse.json({ error: "Failed to restore category" }, { status: 400 });
        }
        const category = await categoryService.getCategoryById(id);
        return NextResponse.json({ success: true, category, message: "Category restored successfully" });
      }

      const parsed = updateCategorySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.format() },
          { status: 400 }
        );
      }

      const category = await categoryService.updateCategory(id, parsed.data);
      return NextResponse.json({ success: true, category });
    } catch (error: any) {
      return handleRouteError(error, "PATCH /api/categories/:id");
    }
  })
);

export const DELETE = withAuth(
  withRoles(["ADMIN", "WAREHOUSE", "MANAGER"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { id } = params;

      await categoryService.deleteCategory(id);
      return NextResponse.json({ success: true, message: "Category soft-deleted successfully" });
    } catch (error: any) {
      return handleRouteError(error, "DELETE /api/categories/:id");
    }
  })
);
