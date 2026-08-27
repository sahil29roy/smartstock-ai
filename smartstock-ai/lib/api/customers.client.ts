import { apiClient } from "@/lib/api-client";
import { Customer, CreateCustomerInput, UpdateCustomerInput } from "@/types/customer/customer.types";

export interface CustomersResponse {
  success: boolean;
  customers: Customer[];
}

export interface CustomerResponse {
  success: boolean;
  customer: Customer;
}

export const customersClient = {
  getCustomers: async (includeDeleted?: boolean): Promise<CustomersResponse> => {
    const url = `/api/customers${includeDeleted ? "?includeDeleted=true" : ""}`;
    return apiClient.get<CustomersResponse>(url);
  },

  getCustomerById: async (id: string): Promise<CustomerResponse> => {
    return apiClient.get<CustomerResponse>(`/api/customers/${id}`);
  },

  createCustomer: async (input: CreateCustomerInput): Promise<CustomerResponse> => {
    return apiClient.post<CustomerResponse>("/api/customers", input);
  },

  updateCustomer: async (id: string, input: UpdateCustomerInput): Promise<CustomerResponse> => {
    return apiClient.patch<CustomerResponse>(`/api/customers/${id}`, input);
  },

  deleteCustomer: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/api/customers/${id}`);
  },
};
