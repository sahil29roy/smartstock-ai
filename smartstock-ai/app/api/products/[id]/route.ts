import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as productService from "@/services/product/product.service";
import { handleRouteError } from "@/lib/errors";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const GET = withAuth(
  withRoles(["ADMIN", "WAREHOUSE", "SALES", "ACCOUNTS", "MANAGER"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { id } = params;

      if (!UUID_REGEX.test(id)) {
        return NextResponse.json({ error: "Invalid product ID format" }, { status: 400 });
      }

      const product = await productService.getProductById(id);
      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, product });
    } catch (error: any) {
      return handleRouteError(error, "GET /api/products/:id");
    }
  })
);

export const PATCH = withAuth(
  withRoles(["ADMIN", "WAREHOUSE", "MANAGER"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { id } = params;

      if (!UUID_REGEX.test(id)) {
        return NextResponse.json({ error: "Invalid product ID format" }, { status: 400 });
      }

      const body = await request.json();

      // Check if this is a restore action
      if (body.action === "restore") {
        const restored = await productService.restoreProduct(id);
        if (!restored) {
          return NextResponse.json({ error: "Failed to restore product" }, { status: 400 });
        }
        const product = await productService.getProductById(id);
        return NextResponse.json({ success: true, product, message: "Product restored successfully" });
      }

      const product = await productService.updateProduct(id, body);
      return NextResponse.json({ success: true, product });
    } catch (error: any) {
      return handleRouteError(error, "PATCH /api/products/:id");
    }
  })
);

export const DELETE = withAuth(
  withRoles(["ADMIN", "WAREHOUSE", "MANAGER"], async (request: AuthenticatedRequest, context: any) => {
    try {
      const params = await context.params;
      const { id } = params;

      if (!UUID_REGEX.test(id)) {
        return NextResponse.json({ error: "Invalid product ID format" }, { status: 400 });
      }

      const deleted = await productService.deleteProduct(id);
      if (!deleted) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: "Product soft-deleted successfully" });
    } catch (error: any) {
      return handleRouteError(error, "DELETE /api/products/:id");
    }
  })
);
