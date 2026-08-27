"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, LoginRequest } from "@/types/auth/auth.types";
import { authClient } from "@/services/auth/auth.client";

interface AuthContextType {
  user: Omit<User, "password_hash"> | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Omit<User, "password_hash"> | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = async () => {
    try {
      const response = await authClient.getCurrentUser();
      if (response.success && response.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  // Initial load
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      await refreshUser();
      setLoading(false);
    };
    initAuth();
  }, []);

  // Listen for centralized 401 session expiration events
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      if (pathname !== "/login") {
        router.push("/login");
      }
    };

    window.addEventListener("api-unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("api-unauthorized", handleUnauthorized);
    };
  }, [router, pathname]);

  const login = async (credentials: LoginRequest) => {
    const response = await authClient.login(credentials);
    if (response.success && response.user) {
      setUser(response.user);
      router.push("/dashboard");
    }
  };

  const logout = async () => {
    try {
      await authClient.logout();
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      setUser(null);
      router.push("/login");
    }
  };

  const isAuthenticated = !!user;

  // Display a professional, non-flickering loader screen on first-load
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-light/35 border-t-primary" />
          <p className="text-xs font-semibold text-secondary-text tracking-wide animate-pulse">
            Loading application...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
