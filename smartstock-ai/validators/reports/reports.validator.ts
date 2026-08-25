import { z } from "zod";

export const salesReportQuerySchema = z.object({
  startDate: z.string().datetime({ message: "Invalid startDate ISO format" }).optional(),
  endDate: z.string().datetime({ message: "Invalid endDate ISO format" }).optional(),
  groupBy: z.enum(["day", "week", "month", "product", "category"]).optional().default("day"),
  categoryId: z.string().uuid("Category ID must be a valid UUID").optional(),
  productId: z.string().uuid("Product ID must be a valid UUID").optional(),
});

export const inventoryReportQuerySchema = z.object({
  categoryId: z.string().uuid("Category ID must be a valid UUID").optional(),
  status: z.enum(["all", "low_stock", "out_of_stock"]).optional().default("all"),
});

export const financialReportQuerySchema = z.object({
  startDate: z.string().datetime({ message: "Invalid startDate ISO format" }).optional(),
  endDate: z.string().datetime({ message: "Invalid endDate ISO format" }).optional(),
});

export const dashboardSummaryQuerySchema = z.object({
  startDate: z.string().datetime({ message: "Invalid startDate ISO format" }).optional(),
  endDate: z.string().datetime({ message: "Invalid endDate ISO format" }).optional(),
});

export type SalesReportQueryInput = z.infer<typeof salesReportQuerySchema>;
export type InventoryReportQueryInput = z.infer<typeof inventoryReportQuerySchema>;
export type FinancialReportQueryInput = z.infer<typeof financialReportQuerySchema>;
export type DashboardSummaryQueryInput = z.infer<typeof dashboardSummaryQuerySchema>;
