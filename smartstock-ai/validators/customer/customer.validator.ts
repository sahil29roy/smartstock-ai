import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(120, "Name must be 120 characters or less"),
  email: z.string().email("Invalid email address").max(160, "Email must be 160 characters or less"),
  phone: z.string().max(20, "Phone number must be 20 characters or less").optional().nullable(),
  address: z.string().optional().nullable(),
  gst_number: z
    .string()
    .max(15, "GST number must be 15 characters or less")
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
