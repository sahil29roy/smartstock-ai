import { z } from "zod";

// --- Supplier Validation ---
export const createSupplierSchema = z.object({
  name: z.string().min(1, "Name is required").max(120, "Name must be 120 characters or less"),
  email: z.string().email("Invalid email address").max(160, "Email must be 160 characters or less"),
  phone: z.string().max(20, "Phone number must be 20 characters or less").nullable().optional(),
  address: z.string().max(1000, "Address must be 1000 characters or less").nullable().optional(),
  is_active: z.boolean().optional(),
  created_by: z.string().uuid("Created by must be a valid UUID").nullable().optional(),
});

export const updateSupplierSchema = z.object({
  name: z.string().min(1, "Name is required").max(120, "Name must be 120 characters or less").optional(),
  email: z.string().email("Invalid email address").max(160, "Email must be 160 characters or less").optional(),
  phone: z.string().max(20, "Phone number must be 20 characters or less").nullable().optional(),
  address: z.string().max(1000, "Address must be 1000 characters or less").nullable().optional(),
  is_active: z.boolean().optional(),
});

// --- Purchase Order Validation ---
export const createPurchaseItemSchema = z.object({
  product_id: z.string().uuid("Product ID must be a valid UUID"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  unit_cost: z.number().nonnegative("Unit cost cannot be negative"),
});

export const createPurchaseSchema = z.object({
  supplier_id: z.string().uuid("Supplier ID must be a valid UUID"),
  total_amount: z.number().nonnegative("Total amount cannot be negative").optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"]).optional(),
  created_by: z.string().uuid("Created by must be a valid UUID").nullable().optional(),
  items: z.array(createPurchaseItemSchema).min(1, "Purchase order must contain at least one item"),
});

export const updatePurchaseSchema = z.object({
  supplier_id: z.string().uuid("Supplier ID must be a valid UUID").optional(),
  total_amount: z.number().nonnegative("Total amount cannot be negative").optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"]).optional(),
});

// --- Goods Receipt Validation ---
export const createGoodsReceiptItemSchema = z.object({
  product_id: z.string().uuid("Product ID must be a valid UUID"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

export const createGoodsReceiptSchema = z.object({
  purchase_id: z.string().uuid("Purchase ID must be a valid UUID"),
  carrier_details: z.string().max(1000, "Carrier details must be 1000 characters or less").nullable().optional(),
  created_by: z.string().uuid("Created by must be a valid UUID").nullable().optional(),
  items: z.array(createGoodsReceiptItemSchema).min(1, "Goods receipt must contain at least one item"),
});

// --- Supplier Payment Validation ---
export const createPurchasePaymentSchema = z.object({
  purchase_id: z.string().uuid("Purchase ID must be a valid UUID"),
  account_id: z.string().optional(),
  amount: z.number().positive("Payment amount must be positive"),
  payment_method: z.enum(["CASH", "CARD", "BANK_TRANSFER", "UPI"]),
  status: z.enum(["PENDING", "COMPLETED", "FAILED"]).optional(),
  created_by: z.string().uuid("Created by must be a valid UUID").nullable().optional(),
});
