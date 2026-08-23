import { z } from "zod";

export const createProductSchema = z.object({
  category_id: z.string().uuid("Invalid category ID"),
  name: z.string().min(1, "Name is required").max(150, "Name must be 150 characters or less"),
  sku: z.string().min(1, "SKU is required").max(50, "SKU must be 50 characters or less"),
  description: z.string().optional().nullable(),
  price: z.number().nonnegative("Price must be non-negative"),
  minimum_stock: z
    .number()
    .int("Minimum stock must be an integer")
    .nonnegative("Minimum stock must be non-negative")
    .optional(),
  location: z.string().max(100, "Location must be 100 characters or less").optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
