import { apiClient } from "@/lib/api-client";
import { Sale, SaleItem, CreateSaleInput, SaleStatus, Payment, CreatePaymentInput } from "@/types/sales/sales.types";

export interface SalesResponse {
  success: boolean;
  sales: Sale[];
}

export interface SaleResponse {
  success: boolean;
  sale: Sale & { items: SaleItem[] };
}

export interface PaymentsResponse {
  success: boolean;
  payments: Payment[];
}

export interface PaymentResponse {
  success: boolean;
  payment: Payment;
}

export const salesClient = {
  getSales: async (params?: { customerId?: string; status?: string }): Promise<SalesResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.customerId) {
      searchParams.append("customerId", params.customerId);
    }
    if (params?.status) {
      searchParams.append("status", params.status);
    }
    const queryString = searchParams.toString();
    const url = `/api/sales${queryString ? `?${queryString}` : ""}`;
    return apiClient.get<SalesResponse>(url);
  },

  getSaleById: async (id: string): Promise<SaleResponse> => {
    return apiClient.get<SaleResponse>(`/api/sales/${id}`);
  },

  createSale: async (input: {
    customer_id: string;
    status?: string;
    items: { product_id: string; quantity: number; unit_price: number }[];
  }): Promise<SaleResponse> => {
    return apiClient.post<SaleResponse>("/api/sales", input);
  },

  updateSaleStatus: async (id: string, status: SaleStatus): Promise<{ success: boolean; sale: Sale }> => {
    return apiClient.patch<{ success: boolean; sale: Sale }>(`/api/sales/${id}`, { status });
  },

  getPayments: async (params?: { saleId?: string; status?: string }): Promise<PaymentsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.saleId) {
      searchParams.append("saleId", params.saleId);
    }
    if (params?.status) {
      searchParams.append("status", params.status);
    }
    const queryString = searchParams.toString();
    const url = `/api/payments${queryString ? `?${queryString}` : ""}`;
    return apiClient.get<PaymentsResponse>(url);
  },

  createPayment: async (input: CreatePaymentInput): Promise<PaymentResponse> => {
    return apiClient.post<PaymentResponse>("/api/payments", input);
  },
};
