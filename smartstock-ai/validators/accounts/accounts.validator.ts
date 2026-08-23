import { z } from "zod";

export const createAccountSchema = z.object({
  name: z.string().min(1, "Account name cannot be empty").max(100, "Account name must be 100 characters or less"),
  type: z.enum(['CASH', 'BANK', 'RECEIVABLE', 'REVENUE', 'EXPENSE']),
  balance: z.number().nonnegative("Balance cannot be negative").optional(),
  description: z.string().max(1000, "Description must be 1000 characters or less").nullable().optional(),
  created_by: z.string().uuid("Created by must be a valid UUID").nullable().optional(),
});

export const updateAccountSchema = z.object({
  name: z.string().min(1, "Account name cannot be empty").max(100, "Account name must be 100 characters or less").optional(),
  type: z.enum(['CASH', 'BANK', 'RECEIVABLE', 'REVENUE', 'EXPENSE']).optional(),
  balance: z.number().nonnegative("Balance cannot be negative").optional(),
  description: z.string().max(1000, "Description must be 1000 characters or less").nullable().optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
