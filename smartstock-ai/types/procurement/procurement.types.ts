export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  is_active: boolean;
  created_by?: string | null;
  deleted_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSupplierInput {
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  is_active?: boolean;
  created_by?: string | null;
}

export interface UpdateSupplierInput {
  name?: string;
  email?: string;
  phone?: string | null;
  address?: string | null;
  is_active?: boolean;
}

export type PurchaseStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';

export interface Purchase {
  id: string;
  supplier_id: string;
  total_amount: number;
  status: PurchaseStatus;
  created_by?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePurchaseInput {
  supplier_id: string;
  total_amount?: number;
  status?: PurchaseStatus;
  created_by?: string | null;
  items: {
    product_id: string;
    quantity: number;
    unit_cost: number;
  }[];
}

export interface UpdatePurchaseInput {
  supplier_id?: string;
  total_amount?: number;
  status?: PurchaseStatus;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  quantity: number;
  received_quantity: number;
  unit_cost: number;
  created_at: Date;
}

export interface CreatePurchaseItemInput {
  purchase_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
}

export type GoodsReceiptStatus = 'RECEIVED' | 'CANCELLED';

export interface GoodsReceipt {
  id: string;
  receipt_number: string;
  purchase_id: string;
  status: GoodsReceiptStatus;
  received_date: Date;
  carrier_details?: string | null;
  created_by?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateGoodsReceiptInput {
  purchase_id: string;
  carrier_details?: string | null;
  created_by?: string | null;
  items: {
    product_id: string;
    quantity: number;
  }[];
}

export interface GoodsReceiptItem {
  id: string;
  goods_receipt_id: string;
  product_id: string;
  quantity: number;
  created_at: Date;
}

export interface CreateGoodsReceiptItemInput {
  goods_receipt_id: string;
  product_id: string;
  quantity: number;
}
