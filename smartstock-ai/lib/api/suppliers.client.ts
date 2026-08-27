import { apiClient } from "@/lib/api-client";
import { Supplier, CreateSupplierInput, UpdateSupplierInput } from "@/types/procurement/procurement.types";

export interface SuppliersResponse {
  success: boolean;
  suppliers: Supplier[];
}

export interface SupplierResponse {
  success: boolean;
  supplier: Supplier;
}

export const suppliersClient = {
  getSuppliers: async (params?: { search?: string; activeOnly?: boolean }): Promise<SuppliersResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.search) {
      searchParams.append("search", params.search);
    }
    if (params?.activeOnly) {
      searchParams.append("activeOnly", "true");
    }
    const queryString = searchParams.toString();
    const url = `/api/suppliers${queryString ? `?${queryString}` : ""}`;
    return apiClient.get<SuppliersResponse>(url);
  },

  getSupplierById: async (id: string): Promise<SupplierResponse> => {
    return apiClient.get<SupplierResponse>(`/api/suppliers/${id}`);
  },

  createSupplier: async (input: CreateSupplierInput): Promise<SupplierResponse> => {
    return apiClient.post<SupplierResponse>("/api/suppliers", input);
  },

  updateSupplier: async (id: string, input: UpdateSupplierInput): Promise<SupplierResponse> => {
    return apiClient.put<SupplierResponse>(`/api/suppliers/${id}`, input);
  },

  deleteSupplier: async (id: string): Promise<SupplierResponse> => {
    return apiClient.delete<SupplierResponse>(`/api/suppliers/${id}`);
  },
};
