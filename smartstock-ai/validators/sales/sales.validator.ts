import { z } from "zod";

export const createSaleSchema = z.object({
  customer_id: z.string().uuid("Customer ID must be a valid UUID"),
  total_amount: z.number().nonnegative("Total amount cannot be negative").optional(),
  status: z.enum(["PENDING", "PAID", "PARTIALLY_PAID", "CANCELLED"]).optional(),
  created_by: z.string().uuid("Created by must be a valid UUID").nullable().optional(),
});

export const updateSaleSchema = z.object({
  total_amount: z.number().nonnegative("Total amount cannot be negative").optional(),
  status: z.enum(["PENDING", "PAID", "PARTIALLY_PAID", "CANCELLED"]).optional(),
});

export const createSaleItemSchema = z.object({
  sale_id: z.string().uuid("Sale ID must be a valid UUID"),
  product_id: z.string().uuid("Product ID must be a valid UUID"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  unit_price: z.number().nonnegative("Unit price cannot be negative"),
});

export const createPaymentBaseSchema = z.object({
  sale_id: z.string().uuid("Sale ID must be a valid UUID").optional(),
  purchase_id: z.string().uuid("Purchase ID must be a valid UUID").optional(),
  account_id: z.string().optional(),
  amount: z.number().positive("Payment amount must be positive"),
  payment_method: z.enum(["CASH", "CARD", "BANK_TRANSFER", "UPI"]),
  status: z.enum(["PENDING", "COMPLETED", "FAILED"]).optional(),
  created_by: z.string().uuid("Created by must be a valid UUID").nullable().optional(),
});

export const createPaymentSchema = createPaymentBaseSchema.refine(data => data.sale_id || data.purchase_id, {
  message: "Either sale_id or purchase_id must be provided",
  path: ["sale_id"]
});

export const updatePaymentSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "FAILED"]),
});

export const createChallanSchema = z.object({
  challan_number: z.string().min(1, "Challan number cannot be empty").max(50, "Challan number must be 50 characters or less"),
  sale_id: z.string().uuid("Sale ID must be a valid UUID"),
  status: z.enum(["PENDING", "DISPATCHED", "DELIVERED", "CANCELLED"]).optional(),
  dispatch_date: z.string().datetime({ message: "Dispatch date must be a valid ISO datetime string" }).nullable().optional(),
  carrier_details: z.string().max(1000, "Carrier details must be 1000 characters or less").nullable().optional(),
  created_by: z.string().uuid("Created by must be a valid UUID").nullable().optional(),
});

export const updateChallanSchema = z.object({
  status: z.enum(["PENDING", "DISPATCHED", "DELIVERED", "CANCELLED"]).optional(),
  dispatch_date: z.string().datetime({ message: "Dispatch date must be a valid ISO datetime string" }).nullable().optional(),
  carrier_details: z.string().max(1000, "Carrier details must be 1000 characters or less").nullable().optional(),
});

export const createChallanItemSchema = z.object({
  challan_id: z.string().uuid("Challan ID must be a valid UUID"),
  product_id: z.string().uuid("Product ID must be a valid UUID"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
export type CreateSaleItemInput = z.infer<typeof createSaleItemSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type UpdateChallanInput = z.infer<typeof updateChallanSchema>;
export type CreateChallanItemInput = z.infer<typeof createChallanItemSchema>;
