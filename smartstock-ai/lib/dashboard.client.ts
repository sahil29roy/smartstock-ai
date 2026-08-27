import { apiClient } from "@/lib/api-client";
import { DashboardSummaryResult } from "@/types/reports/reports.types";

export interface DashboardResponse {
  success: boolean;
  data: DashboardSummaryResult;
}

export const dashboardClient = {
  getDashboardSummary: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<DashboardResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) {
      searchParams.append("startDate", params.startDate);
    }
    if (params?.endDate) {
      searchParams.append("endDate", params.endDate);
    }

    const queryString = searchParams.toString();
    const url = `/api/reports/dashboard${queryString ? `?${queryString}` : ""}`;

    return apiClient.get<DashboardResponse>(url);
  },
};
