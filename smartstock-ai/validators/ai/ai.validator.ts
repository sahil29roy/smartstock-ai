import { z } from "zod";

export const businessSummarySchema = z.object({
  summary: z.string(),
  keyInsights: z.array(z.string()),
  risks: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export const inventoryInsightSchema = z.object({
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  summary: z.string(),
  reasons: z.array(z.string()),
  recommendations: z.array(z.string()),
});

// For /api/ai/inventory route, we return an overall inventory insight, plus product-specific insights
export const inventoryAIResponseSchema = z.object({
  overallSummary: z.string(),
  alertsCount: z.number(),
  products: z.record(
    z.string(), // Product ID (UUID)
    z.object({
      riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
      summary: z.string(),
      reasons: z.array(z.string()),
      recommendations: z.array(z.string()),
    })
  ),
});

export const salesInsightSchema = z.object({
  summary: z.string(),
  observations: z.array(z.string()),
  trends: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export const askAIRequestSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Question cannot be empty")
    .max(500, "Question cannot exceed 500 characters"),
});

export const askAIResponseSchema = z.object({
  answer: z.string(),
  sources: z.array(z.string()),
  limitations: z.array(z.string()).optional(),
});
