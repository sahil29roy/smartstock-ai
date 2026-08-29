import { apiClient } from "@/lib/api-client";
import { Payment, CreatePaymentInput } from "@/types/payment/payment.types";

export interface PaymentsResponse {
  success: boolean;
  payments: Payment[];
}

export interface PaymentResponse {
  success: boolean;
  payment: Payment;
}

export const paymentsClient = {
  getPayments: async (params?: { saleId?: string; purchaseId?: string; status?: string }): Promise<PaymentsResponse> => {
    let url = "/api/payments";
    const queryParts: string[] = [];
    if (params) {
      if (params.saleId) queryParts.push(`saleId=${encodeURIComponent(params.saleId)}`);
      if (params.purchaseId) queryParts.push(`purchaseId=${encodeURIComponent(params.purchaseId)}`);
      if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
    }
    if (queryParts.length > 0) {
      url += `?${queryParts.join("&")}`;
    }
    return apiClient.get<PaymentsResponse>(url);
  },

  createPayment: async (input: CreatePaymentInput): Promise<PaymentResponse> => {
    return apiClient.post<PaymentResponse>("/api/payments", input);
  },
};
