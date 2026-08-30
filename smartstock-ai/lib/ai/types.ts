import { UserRole } from "@/types/auth/auth.types";

export interface AIInsight {
  title: string;
  summary: string;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH";
  recommendations: string[];
}

export interface BusinessSummary {
  summary: string;
  keyInsights: string[];
  risks: string[];
  recommendations: string[];
}

export interface InventoryInsight {
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  summary: string;
  reasons: string[];
  recommendations: string[];
}

export interface SalesInsight {
  summary: string;
  observations: string[];
  trends: string[];
  recommendations: string[];
}

export interface AskAIResponse {
  answer: string;
  sources: string[];
  limitations?: string[];
}

export type AIDomain = "sales" | "inventory" | "procurement" | "finance" | "customers";

export interface AIRequestLog {
  id: string;
  userId: string | null;
  role: UserRole;
  feature: string;
  success: boolean;
  latencyMs: number;
  errorMessage?: string;
  createdAt: Date;
}
