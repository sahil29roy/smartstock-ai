import { apiClient } from "@/lib/api-client";
import { Challan, ChallanItem, CreateChallanInput, UpdateChallanInput, ChallanStatus } from "@/types/sales/sales.types";

export interface ChallansResponse {
  success: boolean;
  challans: Challan[];
}

export interface ChallanResponse {
  success: boolean;
  challan: Challan & { items: ChallanItem[] };
}

export const challansClient = {
  getChallans: async (params?: { saleId?: string; status?: ChallanStatus }): Promise<ChallansResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.saleId) {
      searchParams.append("saleId", params.saleId);
    }
    if (params?.status) {
      searchParams.append("status", params.status);
    }
    const queryString = searchParams.toString();
    const url = `/api/challans${queryString ? `?${queryString}` : ""}`;
    return apiClient.get<ChallansResponse>(url);
  },

  getChallanById: async (id: string): Promise<ChallanResponse> => {
    return apiClient.get<ChallanResponse>(`/api/challans/${id}`);
  },

  createChallan: async (input: {
    challan_number: string;
    sale_id: string;
    status?: ChallanStatus;
    dispatch_date?: string;
    carrier_details?: string;
    items: { product_id: string; quantity: number }[];
  }): Promise<ChallanResponse> => {
    return apiClient.post<ChallanResponse>("/api/challans", input);
  },

  updateChallan: async (id: string, input: UpdateChallanInput): Promise<{ success: boolean; challan: Challan }> => {
    return apiClient.patch<{ success: boolean; challan: Challan }>(`/api/challans/${id}`, input);
  },

  deleteChallan: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/api/challans/${id}`);
  },
};
