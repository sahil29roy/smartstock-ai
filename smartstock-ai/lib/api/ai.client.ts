import { apiClient } from "@/lib/api-client";
import { BusinessSummary, InventoryInsight, SalesInsight, AskAIResponse } from "@/lib/ai/types";

export interface BusinessSummaryResponse {
  success: boolean;
  summary: BusinessSummary;
}

export interface InventoryInsightsResponse {
  success: boolean;
  insights: {
    overallSummary: string;
    alertsCount: number;
    products: Record<string, InventoryInsight>;
  };
}

export interface SalesInsightsResponse {
  success: boolean;
  insights: SalesInsight;
}

export interface AskAIResponseWrapper {
  success: boolean;
  response: AskAIResponse;
}

export const aiClient = {
  getBusinessSummary: async (): Promise<BusinessSummaryResponse> => {
    return apiClient.get<BusinessSummaryResponse>("/api/ai/summary");
  },

  getInventoryInsights: async (): Promise<InventoryInsightsResponse> => {
    return apiClient.get<InventoryInsightsResponse>("/api/ai/inventory");
  },

  getSalesInsights: async (): Promise<SalesInsightsResponse> => {
    return apiClient.get<SalesInsightsResponse>("/api/ai/sales");
  },

  askAI: async (question: string): Promise<AskAIResponseWrapper> => {
    return apiClient.post<AskAIResponseWrapper>("/api/ai/ask", { question });
  },
};
