import { apiClient } from "@/lib/api-client";
import {
  SalesReportResult,
  InventoryReportResult,
  FinancialReportResult,
  CustomerReportResult,
} from "@/types/reports/reports.types";

export interface SalesReportResponse {
  success: boolean;
  data: SalesReportResult;
}

export interface InventoryReportResponse {
  success: boolean;
  data: InventoryReportResult;
}

export interface FinancialReportResponse {
  success: boolean;
  data: FinancialReportResult;
}

export interface CustomerReportResponse {
  success: boolean;
  data: CustomerReportResult;
}

export const reportsClient = {
  getSalesReport: async (params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: "day" | "week" | "month" | "product" | "category";
    categoryId?: string;
    productId?: string;
  }): Promise<SalesReportResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append("startDate", params.startDate);
    if (params?.endDate) searchParams.append("endDate", params.endDate);
    if (params?.groupBy) searchParams.append("groupBy", params.groupBy);
    if (params?.categoryId) searchParams.append("categoryId", params.categoryId);
    if (params?.productId) searchParams.append("productId", params.productId);
    return apiClient.get<SalesReportResponse>(`/api/reports/sales?${searchParams.toString()}`);
  },

  getInventoryReport: async (params?: {
    categoryId?: string;
    status?: "all" | "low_stock" | "out_of_stock";
  }): Promise<InventoryReportResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.categoryId) searchParams.append("categoryId", params.categoryId);
    if (params?.status) searchParams.append("status", params.status);
    return apiClient.get<InventoryReportResponse>(`/api/reports/inventory?${searchParams.toString()}`);
  },

  getFinancialReport: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<FinancialReportResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append("startDate", params.startDate);
    if (params?.endDate) searchParams.append("endDate", params.endDate);
    return apiClient.get<FinancialReportResponse>(`/api/reports/payments?${searchParams.toString()}`);
  },

  getCustomerReport: async (params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<CustomerReportResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append("startDate", params.startDate);
    if (params?.endDate) searchParams.append("endDate", params.endDate);
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    return apiClient.get<CustomerReportResponse>(`/api/reports/customers?${searchParams.toString()}`);
  },
};
