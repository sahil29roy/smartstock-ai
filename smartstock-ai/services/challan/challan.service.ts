import * as repo from "./challan.repository";
import * as inventoryRepo from "../inventory/inventory.repository";
import * as salesService from "../sales/sales.service";
import {
  Challan,
  ChallanItem,
  CreateChallanInput,
  UpdateChallanInput,
  ChallanStatus
} from "@/types/sales/sales.types";

export async function createChallan(
  input: CreateChallanInput,
  items: { product_id: string; quantity: number }[]
): Promise<Challan & { items: ChallanItem[] }> {
  return salesService.createChallan(input, items);
}

export async function getChallanById(id: string): Promise<(Challan & { items: ChallanItem[] }) | null> {
  return salesService.getChallanById(id);
}

export async function getChallans(filters?: { saleId?: string; status?: ChallanStatus }): Promise<Challan[]> {
  return salesService.getChallans(filters);
}

export async function updateChallan(
  id: string,
  input: UpdateChallanInput & { updated_by?: string }
): Promise<Challan> {
  return repo.withTransaction(async (client) => {
    // 1. Lock and fetch challan
    const challan = await repo.getChallanByIdForUpdate(id, client);
    if (!challan) {
      throw new Error("Challan not found.");
    }

    const currentStatus = challan.status;
    const newStatus = input.status;

    // State machine check: once cancelled, cannot be modified
    if (currentStatus === "CANCELLED") {
      throw new Error("Cannot modify a cancelled challan.");
    }

    // 2. Reversal logic if transitioning to CANCELLED
    if (newStatus === "CANCELLED") {
      const items = await repo.getChallanItems(id, client);
      // Sort items by product_id to prevent deadlocks in transactions
      items.sort((a, b) => a.product_id.localeCompare(b.product_id));

      for (const item of items) {
        // Lock inventory row
        const inv = await inventoryRepo.getInventoryByProductIdForUpdate(item.product_id, client);
        if (inv) {
          const newQty = inv.quantity + item.quantity;
          const newReserved = inv.reserved_quantity + item.quantity;

          await inventoryRepo.updateInventory(
            item.product_id,
            { quantity: newQty, reserved_quantity: newReserved },
            client
          );

          // Record compensating stock movement IN
          await inventoryRepo.createStockMovement(
            {
              product_id: item.product_id,
              quantity: item.quantity,
              type: "IN",
              reason: `Reversal: Cancellation of Delivery Challan ${challan.challan_number}`,
              created_by: input.updated_by || null
            },
            client
          );
        }
      }
    }

    // 3. Perform update
    const updatedChallan = await repo.updateChallan(id, input, client);
    if (!updatedChallan) {
      throw new Error("Failed to update challan.");
    }

    return updatedChallan;
  });
}

export async function deleteChallan(id: string, userId?: string): Promise<boolean> {
  return repo.withTransaction(async (client) => {
    const challan = await repo.getChallanByIdForUpdate(id, client);
    if (!challan) {
      throw new Error("Challan not found.");
    }

    // If it was dispatched/delivered, reverse inventory first
    if (challan.status === "DISPATCHED" || challan.status === "DELIVERED") {
      const items = await repo.getChallanItems(id, client);
      // Sort items by product_id to prevent deadlocks in transactions
      items.sort((a, b) => a.product_id.localeCompare(b.product_id));
      for (const item of items) {
        const inv = await inventoryRepo.getInventoryByProductIdForUpdate(item.product_id, client);
        if (inv) {
          const newQty = inv.quantity + item.quantity;
          const newReserved = inv.reserved_quantity + item.quantity;

          await inventoryRepo.updateInventory(
            item.product_id,
            { quantity: newQty, reserved_quantity: newReserved },
            client
          );

          // Compensating stock movement IN
          await inventoryRepo.createStockMovement(
            {
              product_id: item.product_id,
              quantity: item.quantity,
              type: "IN",
              reason: `Reversal: Deletion of Delivery Challan ${challan.challan_number}`,
              created_by: userId || null
            },
            client
          );
        }
      }
    }

    // Delete items and header
    await repo.deleteChallanItems(id, client);
    return await repo.deleteChallan(id, client);
  });
}
