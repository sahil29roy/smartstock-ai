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

  createAccount: async (input: CreateAccountInput): Promise<AccountResponse> => {
    return apiClient.post<AccountResponse>("/api/accounts", input);
  },
};
