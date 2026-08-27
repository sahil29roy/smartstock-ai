import { apiClient } from "@/lib/api-client";
import { Purchase, CreatePurchaseInput, PurchaseItem } from "@/types/procurement/procurement.types";
import { Payment, CreatePaymentInput } from "@/types/sales/sales.types";

export interface PurchasesResponse {
  success: boolean;
  purchases: Purchase[];
}

export interface PurchaseResponse {
  success: boolean;
  purchase: Purchase & { items: PurchaseItem[] };
}

export interface PurchaseStatusResponse {
  success: boolean;
  purchase: Purchase;
}

export interface PaymentsResponse {
  success: boolean;
  payments: Payment[];
}

export interface PaymentResponse {
  success: boolean;
  payment: Payment;
}

export const purchasesClient = {
  getPurchases: async (params?: { supplierId?: string; status?: string }): Promise<PurchasesResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.supplierId) {
      searchParams.append("supplierId", params.supplierId);
    }
    if (params?.status) {
      searchParams.append("status", params.status);
    }
    const queryString = searchParams.toString();
    const url = `/api/purchases${queryString ? `?${queryString}` : ""}`;
    return apiClient.get<PurchasesResponse>(url);
  },

  getPurchaseById: async (id: string): Promise<PurchaseResponse> => {
    return apiClient.get<PurchaseResponse>(`/api/purchases/${id}`);
  },

  createPurchase: async (input: CreatePurchaseInput): Promise<PurchaseResponse> => {
    return apiClient.post<PurchaseResponse>("/api/purchases", input);
  },

  updatePurchaseStatus: async (id: string, status: string): Promise<PurchaseStatusResponse> => {
    return apiClient.patch<PurchaseStatusResponse>(`/api/purchases/${id}`, { status });
  },

  getPaymentsByPurchaseId: async (purchaseId: string): Promise<PaymentsResponse> => {
    return apiClient.get<PaymentsResponse>(`/api/payments?purchaseId=${purchaseId}`);
  },

  createPurchasePayment: async (input: CreatePaymentInput): Promise<PaymentResponse> => {
    return apiClient.post<PaymentResponse>("/api/payments", input);
  },
};
