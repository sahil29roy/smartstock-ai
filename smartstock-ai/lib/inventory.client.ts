import { apiClient } from "@/lib/api-client";
import {
  Inventory,
  InventoryWithProduct,
  StockMovement,
  CreateStockMovementInput,
  AdjustInventoryApiInput
} from "@/types/inventory/inventory.types";

export interface InventorySingleResponse {
  success: boolean;
  inventory: Inventory;
}

export interface InventoryListResponse {
  success: boolean;
  inventory: InventoryWithProduct[];
}

export interface StockMovementsResponse {
  success: boolean;
  movements: StockMovement[];
}

export interface StockMovementSingleResponse {
  success: boolean;
  movement: StockMovement;
}

export const inventoryClient = {
  getInventory: async (): Promise<InventoryListResponse> => {
    return apiClient.get<InventoryListResponse>("/api/inventory");
  },

  getInventoryByProductId: async (productId: string): Promise<InventorySingleResponse> => {
    return apiClient.get<InventorySingleResponse>(`/api/inventory?productId=${productId}`);
  },

  adjustInventory: async (
    productId: string,
    input: AdjustInventoryApiInput
  ): Promise<InventorySingleResponse> => {
    return apiClient.patch<InventorySingleResponse>(`/api/inventory/${productId}`, input);
  },

  getStockMovements: async (productId?: string): Promise<StockMovementsResponse> => {
    const url = `/api/inventory/movements${productId ? `?productId=${productId}` : ""}`;
    return apiClient.get<StockMovementsResponse>(url);
  },

  recordStockMovement: async (
    input: CreateStockMovementInput
  ): Promise<StockMovementSingleResponse> => {
    return apiClient.post<StockMovementSingleResponse>("/api/inventory/movements", input);
  },
};
