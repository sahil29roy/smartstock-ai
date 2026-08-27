import { apiClient } from "@/lib/api-client";
import { Account, CreateAccountInput, UpdateAccountInput } from "@/types/accounts/accounts.types";

export interface AccountsResponse {
  success: boolean;
  accounts: Account[];
}

export interface AccountResponse {
  success: boolean;
  account: Account;
}

export const accountsClient = {
  getAccounts: async (): Promise<AccountsResponse> => {
    return apiClient.get<AccountsResponse>("/api/accounts");
  },

  getAccountById: async (id: string): Promise<AccountResponse> => {
    return apiClient.get<AccountResponse>(`/api/accounts/${id}`);
  },

  createAccount: async (input: CreateAccountInput): Promise<AccountResponse> => {
    return apiClient.post<AccountResponse>("/api/accounts", input);
  },

  updateAccount: async (id: string, input: UpdateAccountInput): Promise<AccountResponse> => {
    return apiClient.patch<AccountResponse>(`/api/accounts/${id}`, input);
  },
};
