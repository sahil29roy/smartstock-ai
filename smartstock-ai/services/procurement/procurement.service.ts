import * as repo from "./procurement.repository";
import * as inventoryRepo from "../inventory/inventory.repository";
import * as accountsRepo from "../accounts/accounts.repository";
import * as paymentRepo from "../payment/payment.repository";
import {
  createSupplierSchema,
  updateSupplierSchema,
  createPurchaseSchema,
  updatePurchaseSchema,
  createGoodsReceiptSchema,
  createPurchasePaymentSchema
} from "@/validators/procurement/procurement.validator";
import {
  Supplier,
  CreateSupplierInput,
  UpdateSupplierInput,
  Purchase,
  CreatePurchaseInput,
  UpdatePurchaseInput,
  PurchaseItem,
  GoodsReceipt,
  CreateGoodsReceiptInput,
  GoodsReceiptItem,
  PurchaseStatus
} from "@/types/procurement/procurement.types";
import { Payment } from "@/types/sales/sales.types";

// === Suppliers Service ===

export async function createSupplier(input: any): Promise<Supplier> {
  const validated = createSupplierSchema.parse(input);
  const existing = await repo.getSupplierByName(validated.name);
  if (existing) {
    throw new Error(`Supplier with name "${validated.name}" already exists.`);
  }
  return repo.createSupplier(validated);
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  return repo.getSupplierById(id);
}

export async function updateSupplier(id: string, input: any): Promise<Supplier | null> {
  const validated = updateSupplierSchema.parse(input);
  const existing = await repo.getSupplierById(id);
  if (!existing) {
    throw new Error("Supplier not found.");
  }
  return repo.updateSupplier(id, validated);
}

export async function deleteSupplier(id: string): Promise<Supplier | null> {
  const existing = await repo.getSupplierById(id);
  if (!existing) {
    throw new Error("Supplier not found.");
  }
  return repo.deleteSupplier(id);
}

export async function getSuppliers(filters?: { search?: string; activeOnly?: boolean }): Promise<Supplier[]> {
  return repo.getSuppliers(filters);
}

// === Purchase Orders Service ===

export async function createPurchase(input: any): Promise<Purchase & { items: PurchaseItem[] }> {
  const validated = createPurchaseSchema.parse(input);

  // Verify supplier exists and is active
  const supplier = await repo.getSupplierById(validated.supplier_id);
  if (!supplier) {
    throw new Error("Supplier not found.");
  }
  if (!supplier.is_active) {
    throw new Error("Cannot create purchase order for an inactive supplier.");
  }

  // Calculate total amount
  const calculatedTotal = validated.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
  const totalAmount = validated.total_amount !== undefined ? validated.total_amount : calculatedTotal;

  return repo.withTransaction(async (client) => {
    const purchase = await repo.createPurchase(
      {
        supplier_id: validated.supplier_id,
        total_amount: totalAmount,
        status: validated.status || "DRAFT",
        created_by: validated.created_by
      },
      client
    );

    const createdItems: PurchaseItem[] = [];
    for (const item of validated.items) {
      const createdItem = await repo.createPurchaseItem(
        {
          purchase_id: purchase.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost
        },
        client
      );
      createdItems.push(createdItem);
    }

    return {
      ...purchase,
      items: createdItems
    };
  });
}

export async function getPurchaseById(id: string): Promise<(Purchase & { items: PurchaseItem[] }) | null> {
  const purchase = await repo.getPurchaseById(id);
  if (!purchase) return null;
  const items = await repo.getPurchaseItems(id);
  return {
    ...purchase,
    items
  };
}

export async function updatePurchaseStatus(purchaseId: string, status: PurchaseStatus): Promise<Purchase> {
  return repo.withTransaction(async (client) => {
    const purchase = await repo.getPurchaseByIdForUpdate(purchaseId, client);
    if (!purchase) {
      throw new Error("Purchase order not found.");
    }

    if (purchase.status === status) {
      return purchase;
    }

    // Restrict cancellation if goods have already been received
    if (status === "CANCELLED" && (purchase.status === "RECEIVED" || purchase.status === "PARTIALLY_RECEIVED")) {
      throw new Error("Cannot cancel a purchase order that has already received goods.");
    }

    const updated = await repo.updatePurchase(purchaseId, { status }, client);
    if (!updated) {
      throw new Error("Failed to update purchase order status.");
    }
    return updated;
  });
}

export async function getPurchases(filters?: { supplierId?: string; status?: PurchaseStatus }): Promise<Purchase[]> {
  return repo.getPurchases(filters);
}

// === Goods Receipts Service ===

export async function createGoodsReceipt(input: any): Promise<GoodsReceipt & { items: GoodsReceiptItem[] }> {
  const validated = createGoodsReceiptSchema.parse(input);
  // Sort items by product_id to prevent deadlocks in transactions
  validated.items.sort((a, b) => a.product_id.localeCompare(b.product_id));

  return repo.withTransaction(async (client) => {
    // 1. Lock and verify Purchase Order
    const purchase = await repo.getPurchaseByIdForUpdate(validated.purchase_id, client);
    if (!purchase) {
      throw new Error("Purchase order not found.");
    }
    if (purchase.status !== "APPROVED" && purchase.status !== "PARTIALLY_RECEIVED") {
      throw new Error(`Cannot receive goods for a purchase order in "${purchase.status}" status. Status must be APPROVED or PARTIALLY_RECEIVED.`);
    }

    // 2. Generate a unique receipt number
    const receiptNumber = `GRN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Create Goods Receipt
    const receipt = await repo.createGoodsReceipt(
      {
        receipt_number: receiptNumber,
        purchase_id: validated.purchase_id,
        carrier_details: validated.carrier_details,
        created_by: validated.created_by
      },
      client
    );

    // 4. Process receipt items
    const createdItems: GoodsReceiptItem[] = [];
    for (const item of validated.items) {
      // Lock the purchase item to prevent concurrent over-receiving
      const poItem = await repo.getPurchaseItemForUpdate(purchase.id, item.product_id, client);
      if (!poItem) {
        throw new Error(`Product with ID ${item.product_id} is not part of this purchase order.`);
      }

      const remainingToReceive = poItem.quantity - poItem.received_quantity;
      if (item.quantity > remainingToReceive) {
        throw new Error(
          `Cannot receive ${item.quantity} units for product ${item.product_id}. Remaining allowed: ${remainingToReceive}.`
        );
      }

      // Update purchase item received quantity
      const newReceivedQuantity = poItem.received_quantity + item.quantity;
      await repo.updatePurchaseItemReceivedQuantity(poItem.id, newReceivedQuantity, client);

      // Increase physical stock in inventory
      let inv = await inventoryRepo.getInventoryByProductIdForUpdate(item.product_id, client);
      if (!inv) {
        inv = await inventoryRepo.createInventory({ product_id: item.product_id }, client);
      }
      const newQty = inv.quantity + item.quantity;
      await inventoryRepo.updateInventory(item.product_id, { quantity: newQty }, client);

      // Record IN stock movement
      await inventoryRepo.createStockMovement(
        {
          product_id: item.product_id,
          quantity: item.quantity,
          type: "IN",
          reason: `Goods receipt recorded. Receipt Number: ${receiptNumber}`,
          created_by: validated.created_by
        },
        client
      );

      // Create Goods Receipt Item
      const createdItem = await repo.createGoodsReceiptItem(
        {
          goods_receipt_id: receipt.id,
          product_id: item.product_id,
          quantity: item.quantity
        },
        client
      );
      createdItems.push(createdItem);
    }

    // 5. Update purchase status based on total received quantities
    const allPoItems = await repo.getPurchaseItems(purchase.id, client);
    const totalOrdered = allPoItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalReceived = allPoItems.reduce((sum, item) => sum + item.received_quantity, 0);

    let newPoStatus: PurchaseStatus = "PARTIALLY_RECEIVED";
    if (totalReceived === totalOrdered) {
      newPoStatus = "RECEIVED";
    } else if (totalReceived === 0) {
      newPoStatus = "APPROVED"; // fall back if nothing received yet
    }

    await repo.updatePurchase(purchase.id, { status: newPoStatus }, client);

    return {
      ...receipt,
      items: createdItems
    };
  });
}

export async function getGoodsReceiptById(id: string): Promise<(GoodsReceipt & { items: GoodsReceiptItem[] }) | null> {
  const receipt = await repo.getGoodsReceiptById(id);
  if (!receipt) return null;
  const items = await repo.getGoodsReceiptItems(id);
  return {
    ...receipt,
    items
  };
}

export async function getGoodsReceipts(filters?: { purchaseId?: string; status?: "RECEIVED" | "CANCELLED" }): Promise<GoodsReceipt[]> {
  return repo.getGoodsReceipts(filters);
}

export async function cancelGoodsReceipt(receiptId: string, userId?: string): Promise<GoodsReceipt> {
  return repo.withTransaction(async (client) => {
    // 1. Lock and fetch Goods Receipt
    const receipt = await repo.getGoodsReceiptByIdForUpdate(receiptId, client);
    if (!receipt) {
      throw new Error("Goods receipt not found.");
    }
    if (receipt.status === "CANCELLED") {
      throw new Error("Goods receipt is already cancelled.");
    }

    // 2. Lock purchase
    const purchase = await repo.getPurchaseByIdForUpdate(receipt.purchase_id, client);
    if (!purchase) {
      throw new Error("Purchase order not found.");
    }

    // 3. Revert quantities and record compensating stock movements
    const receiptItems = await repo.getGoodsReceiptItems(receipt.id, client);
    receiptItems.sort((a, b) => a.product_id.localeCompare(b.product_id));
    for (const item of receiptItems) {
      const poItem = await repo.getPurchaseItemForUpdate(purchase.id, item.product_id, client);
      if (!poItem) {
        throw new Error(`Product ${item.product_id} not found in purchase order.`);
      }

      // Deduct from purchase received_quantity
      const newReceivedQuantity = Math.max(0, poItem.received_quantity - item.quantity);
      await repo.updatePurchaseItemReceivedQuantity(poItem.id, newReceivedQuantity, client);

      // Deduct from physical inventory
      const inv = await inventoryRepo.getInventoryByProductIdForUpdate(item.product_id, client);
      if (!inv) {
        throw new Error(`Inventory record not found for product ${item.product_id}.`);
      }
      const newQty = inv.quantity - item.quantity;
      if (newQty < 0) {
        throw new Error(`Insufficient inventory to cancel goods receipt. Product ${item.product_id} has ${inv.quantity} in stock, but cancellation requires removing ${item.quantity}.`);
      }
      await inventoryRepo.updateInventory(item.product_id, { quantity: newQty }, client);

      // Record compensating OUT stock movement
      await inventoryRepo.createStockMovement(
        {
          product_id: item.product_id,
          quantity: -item.quantity,
          type: "OUT",
          reason: `Goods receipt cancelled. Receipt Number: ${receipt.receipt_number}`,
          created_by: userId
        },
        client
      );
    }

    // 4. Update Goods Receipt Status to CANCELLED
    const cancelledReceipt = await repo.updateGoodsReceiptStatus(receipt.id, "CANCELLED", client);
    if (!cancelledReceipt) {
      throw new Error("Failed to update goods receipt status.");
    }

    // 5. Re-evaluate PO status
    const allPoItems = await repo.getPurchaseItems(purchase.id, client);
    const totalOrdered = allPoItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalReceived = allPoItems.reduce((sum, item) => sum + item.received_quantity, 0);

    let newPoStatus: PurchaseStatus = "APPROVED";
    if (totalReceived === totalOrdered) {
      newPoStatus = "RECEIVED";
    } else if (totalReceived > 0) {
      newPoStatus = "PARTIALLY_RECEIVED";
    }

    await repo.updatePurchase(purchase.id, { status: newPoStatus }, client);

    return cancelledReceipt;
  });
}

// === Supplier Payments Service ===

export async function createSupplierPayment(input: any): Promise<Payment> {
  const validated = createPurchasePaymentSchema.parse(input);

  // Resolve default account based on payment method if not explicitly provided
  let accountId = validated.account_id;
  if (!accountId) {
    if (validated.payment_method === "CASH") {
      accountId = "c1111111-1111-1111-1111-111111111111";
    } else {
      accountId = "c2222222-2222-2222-2222-222222222222";
    }
  }

  return repo.withTransaction(async (client) => {
    // 1. Lock and verify Purchase Order
    const purchase = await repo.getPurchaseByIdForUpdate(validated.purchase_id, client);
    if (!purchase) {
      throw new Error("Purchase order not found.");
    }
    if (purchase.status === "DRAFT" || purchase.status === "CANCELLED") {
      throw new Error(`Cannot pay for a purchase order in "${purchase.status}" status.`);
    }

    // 2. Lock and verify Financial Account
    const account = await accountsRepo.getAccountByIdForUpdate(accountId, client);
    if (!account) {
      throw new Error(`Account with ID ${accountId} not found.`);
    }

    // 3. Verify outstanding balance to prevent over-payment
    const existingPayments = await paymentRepo.getPaymentsByPurchaseId(purchase.id, client);
    const totalPaid = existingPayments
      .filter(p => p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0);

    const outstanding = purchase.total_amount - totalPaid;
    if (validated.amount > outstanding + 0.001) {
      throw new Error(`Payment amount exceeds outstanding balance. Outstanding: ${outstanding}, Requested: ${validated.amount}`);
    }

    // 4. Verify account balance (prevent overdrafts)
    if (account.balance - validated.amount < 0) {
      throw new Error(`Insufficient account balance to process payment. Account balance: ${account.balance}, Requested: ${validated.amount}`);
    }

    // 5. Create Payment record
    const payment = await paymentRepo.createPurchasePayment(
      {
        purchase_id: validated.purchase_id,
        account_id: accountId,
        amount: validated.amount,
        payment_method: validated.payment_method,
        status: validated.status || "COMPLETED",
        created_by: validated.created_by
      },
      client
    );

    if (payment.status === "COMPLETED") {
      // 6. Reduce account balance
      await accountsRepo.updateAccountBalance(accountId, -payment.amount, client);
    }

    return payment;
  });
}

export async function getPaymentsByPurchaseId(purchaseId: string): Promise<Payment[]> {
  return paymentRepo.getPaymentsByPurchaseId(purchaseId);
}
