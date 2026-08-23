import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as categoryService from "@/services/category/category.service";
import { updateCategorySchema } from "@/validators/category/category.validator";

export const GET = withAuth(
  withRoles(["ADMIN", "WAREHOUSE", "SALES", "ACCOUNTS"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { id } = params;

      const category = await categoryService.getCategoryById(id);
      return NextResponse.json({ success: true, category });
    } catch (error: any) {
      console.error(`GET /api/categories/:id error:`, error);
      if (error.message === "Category not found.") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);

export const PATCH = withAuth(
  withRoles(["ADMIN", "WAREHOUSE"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { id } = params;

      const body = await request.json();
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
      console.error(`PATCH /api/categories/:id error:`, error);
      if (error.message === "Category not found.") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: error.message?.includes("already exists") ? 400 : 500 }
      );
    }
  })
);

export const DELETE = withAuth(
  withRoles(["ADMIN", "WAREHOUSE"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { id } = params;

      await categoryService.deleteCategory(id);
      return NextResponse.json({ success: true, message: "Category soft-deleted successfully" });
    } catch (error: any) {
      console.error(`DELETE /api/categories/:id error:`, error);
      if (error.message === "Category not found.") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  })
);
