import { apiClient } from "@/lib/api-client";
import { Account } from "@/types/accounts/accounts.types";

export interface AccountsResponse {
  success: boolean;
  accounts: Account[];
}

export const accountsClient = {
  getAccounts: async (): Promise<AccountsResponse> => {
    return apiClient.get<AccountsResponse>("/api/accounts");
  },
};
