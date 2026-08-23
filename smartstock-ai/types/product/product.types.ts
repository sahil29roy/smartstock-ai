export interface Product {
  id: string;
  category_id: string;
  name: string;
  sku: string;
  description?: string | null;
  price: number;
  minimum_stock: number;
  location?: string | null;
  created_by?: string | null;
  deleted_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProductInput {
  category_id: string;
  name: string;
  sku: string;
  description?: string | null;
  price: number;
  minimum_stock?: number;
  location?: string | null;
  created_by?: string | null;
}

export interface UpdateProductInput {
  category_id?: string;
  name?: string;
  sku?: string;
  description?: string | null;
  price?: number;
  minimum_stock?: number;
  location?: string | null;
}
