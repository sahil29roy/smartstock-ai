import { apiClient } from "@/lib/api-client";
import { LoginRequest, LoginResponse, MeResponse } from "@/types/auth/auth.types";

export const authClient = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>("/api/auth/login", credentials);
  },

  logout: async (): Promise<void> => {
    await apiClient.post<{ success: boolean }>("/api/auth/logout");
  },

  getCurrentUser: async (): Promise<MeResponse> => {
    return apiClient.get<MeResponse>("/api/auth/me");
  },
};
