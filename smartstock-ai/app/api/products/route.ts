import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/authenticate";
import { withRoles } from "@/middleware/authorize";
import * as productService from "@/services/product/product.service";
import { handleRouteError } from "@/lib/errors";

export const GET = withAuth(
  withRoles(["ADMIN", "WAREHOUSE", "SALES", "ACCOUNTS"], async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const categoryId = searchParams.get("categoryId") || undefined;
      const search = searchParams.get("search") || undefined;
      
      // Only admins and warehouse staff can see soft-deleted products
      const userRole = request.user?.role;
      const canSeeDeleted = userRole === "ADMIN" || userRole === "WAREHOUSE";
      const includeDeleted = canSeeDeleted ? searchParams.get("includeDeleted") === "true" : false;

      const products = await productService.getProducts({ categoryId, search, includeDeleted });
      return NextResponse.json({ success: true, products });
    } catch (error: any) {
      return handleRouteError(error, "GET /api/products");
    }
  })
);

export const POST = withAuth(
  withRoles(["ADMIN", "WAREHOUSE"], async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const createdBy = request.user?.id;

      const product = await productService.createProduct({
        ...body,
        created_by: createdBy
      });

      return NextResponse.json({ success: true, product }, { status: 201 });
    } catch (error: any) {
      return handleRouteError(error, "POST /api/products");
    }
  })
);
