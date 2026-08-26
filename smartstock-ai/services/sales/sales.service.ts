import * as repo from "./sales.repository";
import * as inventoryRepo from "../inventory/inventory.repository";
import * as accountsRepo from "../accounts/accounts.repository";
import { pool } from "@/lib/db";
import {
  Sale,
  SaleItem,
  CreateSaleInput,
  SaleStatus,
  Payment,
  CreatePaymentInput,
  Challan,
  CreateChallanInput,
  ChallanItem,
  ChallanStatus
} from "@/types/sales/sales.types";

// === Sales Service ===

export async function createSale(
  input: CreateSaleInput,
  items: { product_id: string; quantity: number; unit_price: number }[]
): Promise<Sale & { items: SaleItem[] }> {
  if (items.length === 0) {
    throw new Error("A sale must contain at least one item.");
  }

  return repo.withTransaction(async (client) => {
    // 1. Verify customer exists
    const customerCheck = await client.query(
      "SELECT id FROM customers WHERE id = $1 AND deleted_at IS NULL",
      [input.customer_id]
    );
    if (customerCheck.rowCount === 0) {
      throw new Error("Customer not found or is inactive.");
    }

    // 2. Lock & Validate inventory and products
    const productIds = items.map(item => item.product_id);
    const productCheck = await client.query(
      "SELECT id, sku, price FROM products WHERE id = ANY($1) AND deleted_at IS NULL",
      [productIds]
    );
    const productMap = new Map<string, { sku: string; price: number }>();
    productCheck.rows.forEach(row => {
      productMap.set(row.id, { sku: row.sku, price: parseFloat(row.price) });
    });

    const saleItemsToCreate: { product_id: string; quantity: number; unit_price: number }[] = [];
    let calculatedTotal = 0;

    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        throw new Error(`Product with ID ${item.product_id} not found or is inactive.`);
      }

      // Lock inventory for update
      let inv = await inventoryRepo.getInventoryByProductIdForUpdate(item.product_id, client);
      if (!inv) {
        inv = await inventoryRepo.createInventory({ product_id: item.product_id }, client);
      }

      // Check available stock (current quantity - reserved)
      const availableStock = inv.quantity - inv.reserved_quantity;
      if (availableStock < item.quantity) {
        throw new Error(
          `Insufficient stock for product SKU: ${product.sku}. Available: ${availableStock}, Requested: ${item.quantity}.`
        );
      }

      calculatedTotal += item.quantity * item.unit_price;
      saleItemsToCreate.push(item);
    }

    // 3. Create Sale Header
    const sale = await repo.createSale(
      {
        ...input,
        total_amount: calculatedTotal,
        status: input.status || "PENDING"
      },
      client
    );

    // 4. Create Sale Items & Reserve Inventory
    const createdItems: SaleItem[] = [];
    for (const item of saleItemsToCreate) {
      const saleItem = await repo.createSaleItem(
        {
          sale_id: sale.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        },
        client
      );
      createdItems.push(saleItem);

      // Reserve stock if status is not CANCELLED
      if (sale.status !== "CANCELLED") {
        const inv = await inventoryRepo.getInventoryByProductIdForUpdate(item.product_id, client);
        if (inv) {
          const newReserved = inv.reserved_quantity + item.quantity;
          await inventoryRepo.updateInventory(
            item.product_id,
            { reserved_quantity: newReserved },
            client
          );
        }
      }
    }

    return {
      ...sale,
      items: createdItems
    };
  });
}

export async function getSaleById(id: string): Promise<(Sale & { items: SaleItem[] }) | null> {
  const sale = await repo.getSaleById(id);
  if (!sale) return null;
  const items = await repo.getSaleItems(id);
  return {
    ...sale,
    items
  };
}

export async function updateSaleStatus(saleId: string, status: SaleStatus): Promise<Sale> {
  return repo.withTransaction(async (client) => {
    const sale = await repo.getSaleByIdForUpdate(saleId, client);
    if (!sale) {
      throw new Error("Sale not found.");
    }

    if (sale.status === status) {
      return sale;
    }

    const items = await repo.getSaleItems(saleId, client);

    // Handle inventory reservation adjustments based on state transitions
    if (sale.status !== "CANCELLED" && status === "CANCELLED") {
      // Release reservation
      for (const item of items) {
        const inv = await inventoryRepo.getInventoryByProductIdForUpdate(item.product_id, client);
        if (inv) {
          const newReserved = Math.max(0, inv.reserved_quantity - item.quantity);
          await inventoryRepo.updateInventory(item.product_id, { reserved_quantity: newReserved }, client);
        }
      }
    } else if (sale.status === "CANCELLED" && status !== "CANCELLED") {
      // Re-reserve stock, verifying available stock first
      for (const item of items) {
        let inv = await inventoryRepo.getInventoryByProductIdForUpdate(item.product_id, client);
        if (!inv) {
          inv = await inventoryRepo.createInventory({ product_id: item.product_id }, client);
        }
        const availableStock = inv.quantity - inv.reserved_quantity;
        if (availableStock < item.quantity) {
          throw new Error(`Insufficient stock to re-activate sale. Product ID: ${item.product_id}. Available: ${availableStock}, Required: ${item.quantity}.`);
        }
        const newReserved = inv.reserved_quantity + item.quantity;
        await inventoryRepo.updateInventory(item.product_id, { reserved_quantity: newReserved }, client);
      }
    }

    const updatedSale = await repo.updateSale(saleId, { status }, client);
    if (!updatedSale) {
      throw new Error("Failed to update sale status.");
    }
    return updatedSale;
  });
}

export async function getSales(filters?: { customerId?: string; status?: SaleStatus }): Promise<Sale[]> {
  return repo.getSales(filters);
}

// === Payments Service ===

export async function createPayment(input: CreatePaymentInput): Promise<Payment> {
  if (!input.sale_id) {
    throw new Error("Sale ID is required for sales payment.");
  }
  return repo.withTransaction(async (client) => {
    const sale = await repo.getSaleByIdForUpdate(input.sale_id!, client);
    if (!sale) {
      throw new Error("Sale not found.");
    }

    // Resolve account_id if not provided
    let accountId = input.account_id;
    if (!accountId) {
      if (input.payment_method === "CASH") {
        accountId = "c1111111-1111-1111-1111-111111111111"; // Cash Account
      } else {
        accountId = "c2222222-2222-2222-2222-222222222222"; // Bank Account
      }
    }

    // Lock and verify account exists
    const account = await accountsRepo.getAccountByIdForUpdate(accountId, client);
    if (!account) {
      throw new Error(`Account with ID ${accountId} not found.`);
    }

    // Create payment with resolved account_id
    const payment = await repo.createPayment(
      {
        ...input,
        account_id: accountId
      },
      client
    );

    if (payment.status === "COMPLETED") {
      // Update account balance
      await accountsRepo.updateAccountBalance(accountId, payment.amount, client);

      // Fetch all completed payments to update Sale status
      const payments = await repo.getPaymentsBySaleId(input.sale_id!, client);
      const totalPaid = payments
        .filter(p => p.status === "COMPLETED")
        .reduce((sum, p) => sum + p.amount, 0);

      let newStatus: SaleStatus = "PENDING";
      if (totalPaid >= sale.total_amount) {
        newStatus = "PAID";
      } else if (totalPaid > 0) {
        newStatus = "PARTIALLY_PAID";
      }

      if (sale.status !== newStatus) {
        await repo.updateSale(sale.id, { status: newStatus }, client);
      }
    }

    return payment;
  });
}

export async function getPaymentsBySaleId(saleId: string): Promise<Payment[]> {
  return repo.getPaymentsBySaleId(saleId);
}

// === Challans Service ===

export async function createChallan(
  input: CreateChallanInput,
  items: { product_id: string; quantity: number }[]
): Promise<Challan & { items: ChallanItem[] }> {
  if (items.length === 0) {
    throw new Error("A delivery challan must contain at least one item.");
  }

  return repo.withTransaction(async (client) => {
    // 1. Verify Sale exists
    const sale = await repo.getSaleById(input.sale_id, client);
    if (!sale) {
      throw new Error("Sale not found.");
    }
    if (sale.status === "CANCELLED") {
      throw new Error("Cannot dispatch challan for a cancelled sale.");
    }

    // 2. Check challan number uniqueness
    const existingChallan = await repo.getChallanByNumber(input.challan_number, client);
    if (existingChallan) {
      throw new Error(`Challan number "${input.challan_number}" already exists.`);
    }

    // 3. Fetch sale items and existing dispatches to calculate remaining ship balances
    const saleItems = await repo.getSaleItems(input.sale_id, client);
    const saleItemsMap = new Map<string, number>();
    saleItems.forEach(item => {
      saleItemsMap.set(item.product_id, item.quantity);
    });

    const existingChallans = await repo.getChallans({ saleId: input.sale_id }, client);
    const dispatchedMap = new Map<string, number>();

    for (const chal of existingChallans) {
      if (chal.status === "CANCELLED") continue;
      const chalItems = await repo.getChallanItems(chal.id, client);
      chalItems.forEach(item => {
        const current = dispatchedMap.get(item.product_id) || 0;
        dispatchedMap.set(item.product_id, current + item.quantity);
      });
    }

    // 4. Validate dispatch limits and actual warehouse stock
    const challanItemsToCreate: { product_id: string; quantity: number }[] = [];

    for (const item of items) {
      const orderedQty = saleItemsMap.get(item.product_id);
      if (orderedQty === undefined) {
        throw new Error(`Product ${item.product_id} is not part of this sale.`);
      }

      const alreadyShipped = dispatchedMap.get(item.product_id) || 0;
      const remainingToShip = orderedQty - alreadyShipped;
      if (item.quantity > remainingToShip) {
        throw new Error(
          `Cannot dispatch quantity (${item.quantity}) exceeding remaining items to ship (${remainingToShip}).`
        );
      }

      // Check physical inventory availability
      let inv = await inventoryRepo.getInventoryByProductIdForUpdate(item.product_id, client);
      if (!inv || inv.quantity < item.quantity) {
        throw new Error(
          `Insufficient physical stock in warehouse for product ${item.product_id}. Available: ${inv ? inv.quantity : 0}, Requested: ${item.quantity}.`
        );
      }

      challanItemsToCreate.push(item);
    }

    // 5. Create Challan Header
    const challan = await repo.createChallan(
      {
        ...input,
        status: input.status || "DISPATCHED",
        dispatch_date: input.dispatch_date || new Date()
      },
      client
    );

    // 6. Create Challan Items, deduct inventory & record stock movements
    const createdItems: ChallanItem[] = [];
    for (const item of challanItemsToCreate) {
      const challanItem = await repo.createChallanItem(
        {
          challan_id: challan.id,
          product_id: item.product_id,
          quantity: item.quantity
        },
        client
      );
      createdItems.push(challanItem);

      // Deduct warehouse quantity and release reserved quantity
      const inv = await inventoryRepo.getInventoryByProductIdForUpdate(item.product_id, client);
      if (inv) {
        const newQty = inv.quantity - item.quantity;
        // Reduce reserved stock since the item is shipped out
        const newReserved = Math.max(0, inv.reserved_quantity - item.quantity);

        await inventoryRepo.updateInventory(
          item.product_id,
          { quantity: newQty, reserved_quantity: newReserved },
          client
        );

        // Record stock movement OUT
        await inventoryRepo.createStockMovement(
          {
            product_id: item.product_id,
            quantity: -item.quantity,
            type: "OUT",
            reason: `Dispatch via Delivery Challan ${challan.challan_number}`,
            created_by: input.created_by
          },
          client
        );
      }
    }

    return {
      ...challan,
      items: createdItems
    };
  });
}

export async function getChallanById(id: string): Promise<(Challan & { items: ChallanItem[] }) | null> {
  const challan = await repo.getChallanById(id);
  if (!challan) return null;
  const items = await repo.getChallanItems(id);
  return {
    ...challan,
    items
  };
}

export async function getChallans(filters?: { saleId?: string; status?: ChallanStatus }): Promise<Challan[]> {
  return repo.getChallans(filters);
}
