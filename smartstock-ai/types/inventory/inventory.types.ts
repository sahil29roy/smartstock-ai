export interface Inventory {
  id: string;
  product_id: string;
  quantity: number;
  reserved_quantity: number;
  location?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateInventoryInput {
  product_id: string;
  quantity?: number;
  reserved_quantity?: number;
  location?: string | null;
}

export interface UpdateInventoryInput {
  quantity?: number;
  reserved_quantity?: number;
  location?: string | null;
}

export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGE' | 'LOSS';

export interface StockMovement {
  id: string;
  product_id: string;
  quantity: number;
  type: StockMovementType;
  reason?: string | null;
  created_by?: string | null;
  created_at: Date;
}

export interface CreateStockMovementInput {
  product_id: string;
  quantity: number;
  type: StockMovementType;
  reason?: string | null;
  created_by?: string | null;
}
