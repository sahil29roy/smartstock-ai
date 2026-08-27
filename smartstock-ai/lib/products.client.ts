import { apiClient } from "@/lib/api-client";
import { Product, CreateProductInput, UpdateProductInput } from "@/types/product/product.types";

export interface ProductsResponse {
  success: boolean;
  products: Product[];
}

export interface ProductResponse {
  success: boolean;
  product: Product;
}

export interface DeleteProductResponse {
  success: boolean;
  message: string;
}

export const productsClient = {
  getProducts: async (params?: {
    categoryId?: string;
    search?: string;
    includeDeleted?: boolean;
  }): Promise<ProductsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.categoryId) {
      searchParams.append("categoryId", params.categoryId);
    }
    if (params?.search) {
      searchParams.append("search", params.search);
    }
    if (params?.includeDeleted) {
      searchParams.append("includeDeleted", "true");
    }

    const queryString = searchParams.toString();
    const url = `/api/products${queryString ? `?${queryString}` : ""}`;
    return apiClient.get<ProductsResponse>(url);
  },

  getProductById: async (id: string): Promise<ProductResponse> => {
    return apiClient.get<ProductResponse>(`/api/products/${id}`);
  },

  createProduct: async (input: CreateProductInput): Promise<ProductResponse> => {
    return apiClient.post<ProductResponse>("/api/products", input);
  },

  updateProduct: async (id: string, input: UpdateProductInput): Promise<ProductResponse> => {
    return apiClient.patch<ProductResponse>(`/api/products/${id}`, input);
  },

  deleteProduct: async (id: string): Promise<DeleteProductResponse> => {
    return apiClient.delete<DeleteProductResponse>(`/api/products/${id}`);
  },

  restoreProduct: async (id: string): Promise<ProductResponse> => {
    return apiClient.patch<ProductResponse>(`/api/products/${id}`, { action: "restore" });
  },
};
