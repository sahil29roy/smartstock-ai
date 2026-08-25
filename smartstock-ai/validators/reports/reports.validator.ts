import { z } from "zod";

const dateRangeRefinement = (data: { startDate?: string; endDate?: string }) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
};

const dateRangeMessage = {
  message: "startDate must be less than or equal to endDate",
  path: ["startDate"],
};

export const salesReportQuerySchema = z.object({
  startDate: z.string().datetime({ message: "Invalid startDate ISO format" }).optional(),
  endDate: z.string().datetime({ message: "Invalid endDate ISO format" }).optional(),
  groupBy: z.enum(["day", "week", "month", "product", "category"]).optional().default("day"),
  categoryId: z.string().uuid("Category ID must be a valid UUID").optional(),
  productId: z.string().uuid("Product ID must be a valid UUID").optional(),
}).refine(dateRangeRefinement, dateRangeMessage);

export const inventoryReportQuerySchema = z.object({
  categoryId: z.string().uuid("Category ID must be a valid UUID").optional(),
  status: z.enum(["all", "low_stock", "out_of_stock"]).optional().default("all"),
});

export const financialReportQuerySchema = z.object({
  startDate: z.string().datetime({ message: "Invalid startDate ISO format" }).optional(),
  endDate: z.string().datetime({ message: "Invalid endDate ISO format" }).optional(),
}).refine(dateRangeRefinement, dateRangeMessage);

export const dashboardSummaryQuerySchema = z.object({
  startDate: z.string().datetime({ message: "Invalid startDate ISO format" }).optional(),
  endDate: z.string().datetime({ message: "Invalid endDate ISO format" }).optional(),
}).refine(dateRangeRefinement, dateRangeMessage);

export const customerReportQuerySchema = z.object({
  startDate: z.string().datetime({ message: "Invalid startDate ISO format" }).optional(),
  endDate: z.string().datetime({ message: "Invalid endDate ISO format" }).optional(),
  limit: z.preprocess(
    (val) => (val === undefined ? undefined : Number(val)),
    z.number().int().positive().optional()
  ).default(10),
}).refine(dateRangeRefinement, dateRangeMessage);

export type SalesReportQueryInput = z.infer<typeof salesReportQuerySchema>;
export type InventoryReportQueryInput = z.infer<typeof inventoryReportQuerySchema>;
export type FinancialReportQueryInput = z.infer<typeof financialReportQuerySchema>;
export type DashboardSummaryQueryInput = z.infer<typeof dashboardSummaryQuerySchema>;
export type CustomerReportQueryInput = z.infer<typeof customerReportQuerySchema>;
