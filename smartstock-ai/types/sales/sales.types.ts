export type SaleStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';

export interface Sale {
  id: string;
  customer_id: string;
  total_amount: number;
  status: SaleStatus;
  created_by?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSaleInput {
  customer_id: string;
  total_amount?: number;
  status?: SaleStatus;
  created_by?: string | null;
}

export interface UpdateSaleInput {
  total_amount?: number;
  status?: SaleStatus;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at: Date;
}

export interface CreateSaleItemInput {
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'UPI';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface Payment {
  id: string;
  sale_id: string;
  account_id: string;
  amount: number;
  payment_date: Date;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  created_by?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePaymentInput {
  sale_id: string;
  account_id?: string;
  amount: number;
  payment_method: PaymentMethod;
  status?: PaymentStatus;
  created_by?: string | null;
}

export interface UpdatePaymentInput {
  status?: PaymentStatus;
}

export type ChallanStatus = 'PENDING' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';

export interface Challan {
  id: string;
  challan_number: string;
  sale_id: string;
  status: ChallanStatus;
  dispatch_date?: Date | null;
  carrier_details?: string | null;
  created_by?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateChallanInput {
  challan_number: string;
  sale_id: string;
  status?: ChallanStatus;
  dispatch_date?: Date | null;
  carrier_details?: string | null;
  created_by?: string | null;
}

export interface UpdateChallanInput {
  status?: ChallanStatus;
  dispatch_date?: Date | null;
  carrier_details?: string | null;
}

export interface ChallanItem {
  id: string;
  challan_id: string;
  product_id: string;
  quantity: number;
  created_at: Date;
}

export interface CreateChallanItemInput {
  challan_id: string;
  product_id: string;
  quantity: number;
}
