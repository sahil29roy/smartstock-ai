import { z } from "zod";

export const createInventorySchema = z.object({
  product_id: z.string().uuid("Product ID must be a valid UUID"),
  quantity: z.number().int().nonnegative("Quantity cannot be negative").optional(),
  reserved_quantity: z.number().int().nonnegative("Reserved quantity cannot be negative").optional(),
  location: z.string().max(100, "Location must be 100 characters or less").nullable().optional(),
});

export const updateInventorySchema = z.object({
  quantity: z.number().int().nonnegative("Quantity cannot be negative").optional(),
  reserved_quantity: z.number().int().nonnegative("Reserved quantity cannot be negative").optional(),
  location: z.string().max(100, "Location must be 100 characters or less").nullable().optional(),
});

export const createStockMovementSchema = z.object({
  product_id: z.string().uuid("Product ID must be a valid UUID"),
  quantity: z.number().int().refine((val) => val !== 0, {
    message: "Quantity cannot be zero",
  }),
  type: z.enum(["IN", "OUT", "ADJUSTMENT", "DAMAGE", "LOSS"]),
  reason: z.string().max(500, "Reason must be 500 characters or less").nullable().optional(),
});

export const adjustInventoryApiSchema = z.object({
  location: z.string().max(100, "Location must be 100 characters or less").nullable().optional(),
  reserved_change: z.number().int("reserved_change must be an integer").optional(),
});

export type CreateInventoryInput = z.infer<typeof createInventorySchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
export type AdjustInventoryApiInput = z.infer<typeof adjustInventoryApiSchema>;

