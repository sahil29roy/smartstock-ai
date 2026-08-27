import { apiClient } from "@/lib/api-client";
import { GoodsReceipt, CreateGoodsReceiptInput, GoodsReceiptItem } from "@/types/procurement/procurement.types";

export interface GoodsReceiptsResponse {
  success: boolean;
  goodsReceipts: GoodsReceipt[];
}

export interface GoodsReceiptResponse {
  success: boolean;
  goodsReceipt: GoodsReceipt & { items: GoodsReceiptItem[] };
}

export const goodsReceiptsClient = {
  getGoodsReceipts: async (params?: { purchaseId?: string; status?: string }): Promise<GoodsReceiptsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.purchaseId) {
      searchParams.append("purchaseId", params.purchaseId);
    }
    if (params?.status) {
      searchParams.append("status", params.status);
    }
    const queryString = searchParams.toString();
    const url = `/api/goods-receipts${queryString ? `?${queryString}` : ""}`;
    return apiClient.get<GoodsReceiptsResponse>(url);
  },

  getGoodsReceiptById: async (id: string): Promise<GoodsReceiptResponse> => {
    return apiClient.get<GoodsReceiptResponse>(`/api/goods-receipts/${id}`);
  },

  createGoodsReceipt: async (input: CreateGoodsReceiptInput): Promise<GoodsReceiptResponse> => {
    return apiClient.post<GoodsReceiptResponse>("/api/goods-receipts", input);
  },

  cancelGoodsReceipt: async (id: string): Promise<GoodsReceiptResponse> => {
    return apiClient.delete<GoodsReceiptResponse>(`/api/goods-receipts/${id}`);
  },
};
