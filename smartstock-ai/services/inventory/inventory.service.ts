import * as repo from "./inventory.repository";
import {
  Inventory,
  StockMovement,
  CreateStockMovementInput,
  UpdateInventoryInput
} from "@/types/inventory/inventory.types";

export async function getInventoryByProductId(productId: string): Promise<Inventory> {
  let inv = await repo.getInventoryByProductId(productId);
  if (!inv) {
    // Automatically initialize inventory for the product if it doesn't exist yet
    inv = await repo.createInventory({ product_id: productId });
  }
  return inv;
}

export async function updateInventoryLocation(productId: string, location: string | null): Promise<Inventory> {
  // Ensure inventory record exists
  await getInventoryByProductId(productId);
  const updated = await repo.updateInventory(productId, { location });
  if (!updated) {
    throw new Error("Failed to update inventory location.");
  }
  return updated;
}

export async function adjustReservedStock(productId: string, reservedChange: number): Promise<Inventory> {
  return repo.withTransaction(async (client) => {
    let inv = await repo.getInventoryByProductIdForUpdate(productId, client);
    if (!inv) {
      inv = await repo.createInventory({ product_id: productId }, client);
    }

    const newReserved = inv.reserved_quantity + reservedChange;
    if (newReserved < 0) {
      throw new Error("Reserved quantity cannot be negative.");
    }
    if (newReserved > inv.quantity) {
      throw new Error(`Reserved quantity (${newReserved}) cannot exceed current stock quantity (${inv.quantity}).`);
    }

    const updated = await repo.updateInventory(productId, { reserved_quantity: newReserved }, client);
    if (!updated) {
      throw new Error("Failed to update reserved stock.");
    }
    return updated;
  });
}

export async function recordStockMovement(input: CreateStockMovementInput): Promise<StockMovement> {
  return repo.withTransaction(async (client) => {
    let inv = await repo.getInventoryByProductIdForUpdate(input.product_id, client);
    if (!inv) {
      inv = await repo.createInventory({ product_id: input.product_id }, client);
    }

    const newQty = inv.quantity + input.quantity;
    if (newQty < 0) {
      throw new Error(`Insufficient stock for this movement. Current stock: ${inv.quantity}, attempted change: ${input.quantity}.`);
    }
    if (newQty < inv.reserved_quantity) {
      throw new Error(`Stock level (${newQty}) cannot drop below reserved quantity (${inv.reserved_quantity}).`);
    }

    await repo.updateInventory(input.product_id, { quantity: newQty }, client);
    return repo.createStockMovement(input, client);
  });
}

export async function getStockMovements(productId?: string): Promise<StockMovement[]> {
  return repo.getStockMovements(productId);
}
