import { generateContent } from "@/lib/ai/gemini";
import * as contextService from "./context.service";
import * as prompts from "@/lib/ai/prompts";
import * as validators from "@/validators/ai/ai.validator";
import { query } from "@/lib/db";
import { UserRole } from "@/types/auth/auth.types";

/**
 * Logs AI request metadata for auditing and metrics.
 */
export async function logAIRequest(
  userId: string | null,
  role: UserRole,
  feature: string,
  success: boolean,
  latencyMs: number,
  errorMessage?: string
): Promise<void> {
  try {
    await query(
      `INSERT INTO ai_logs (user_id, user_role, feature, success, latency_ms, error_message)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, role, feature, success, latencyMs, errorMessage || null]
    );
  } catch (err) {
    console.error("Failed to write to ai_logs table:", err);
  }
}

/**
 * Generates an operational business summary of the ERP system for Dashboard.
 */
export async function generateBusinessSummary(role: UserRole, userId: string) {
  const startTime = Date.now();
  let success = false;
  let errorMessage: string | undefined;

  try {
    const context = await contextService.getSummaryContext(role);
    const prompt = prompts.BUSINESS_SUMMARY_PROMPT.replace("{context}", JSON.stringify(context, null, 2));

    const responseText = await generateContent(prompt, {
      systemInstruction: prompts.BASE_SYSTEM_PROMPT,
      jsonMode: true,
    });

    const parsed = validators.businessSummarySchema.parse(JSON.parse(responseText));
    success = true;
    return parsed;
  } catch (err: any) {
    errorMessage = err.message || "Unknown error";
    throw err;
  } finally {
    const latency = Date.now() - startTime;
    await logAIRequest(userId, role, "business_summary", success, latency, errorMessage);
  }
}

/**
 * Generates inventory health insights and alerts map.
 */
export async function generateInventoryInsights(role: UserRole, userId: string) {
  const startTime = Date.now();
  let success = false;
  let errorMessage: string | undefined;

  try {
    const context = await contextService.getInventoryContext(role);
    const prompt = prompts.INVENTORY_ANALYSIS_PROMPT.replace("{context}", JSON.stringify(context, null, 2));

    const responseText = await generateContent(prompt, {
      systemInstruction: prompts.BASE_SYSTEM_PROMPT,
      jsonMode: true,
    });

    const parsed = validators.inventoryAIResponseSchema.parse(JSON.parse(responseText));
    success = true;
    return parsed;
  } catch (err: any) {
    errorMessage = err.message || "Unknown error";
    throw err;
  } finally {
    const latency = Date.now() - startTime;
    await logAIRequest(userId, role, "inventory_insights", success, latency, errorMessage);
  }
}

/**
 * Generates sales performance insights.
 */
export async function generateSalesInsights(role: UserRole, userId: string) {
  const startTime = Date.now();
  let success = false;
  let errorMessage: string | undefined;

  try {
    const context = await contextService.getSalesContext(role);
    const prompt = prompts.SALES_ANALYSIS_PROMPT.replace("{context}", JSON.stringify(context, null, 2));

    const responseText = await generateContent(prompt, {
      systemInstruction: prompts.BASE_SYSTEM_PROMPT,
      jsonMode: true,
    });

    const parsed = validators.salesInsightSchema.parse(JSON.parse(responseText));
    success = true;
    return parsed;
  } catch (err: any) {
    errorMessage = err.message || "Unknown error";
    throw err;
  } finally {
    const latency = Date.now() - startTime;
    await logAIRequest(userId, role, "sales_insights", success, latency, errorMessage);
  }
}

/**
 * Performs a natural language query over permitted context domains.
 */
export async function askSmartStock(role: UserRole, userId: string, question: string) {
  // Validate request parameter
  const validation = validators.askAIRequestSchema.safeParse({ question });
  if (!validation.success) {
    throw new Error(validation.error.errors[0]?.message || "Invalid question");
  }

  const startTime = Date.now();
  let success = false;
  let errorMessage: string | undefined;

  try {
    const context = await contextService.getAskContext(role, question);
    const prompt = prompts.ASK_AI_PROMPT
      .replace("{context}", JSON.stringify(context, null, 2))
      .replace("{question}", question);

    const responseText = await generateContent(prompt, {
      systemInstruction: prompts.BASE_SYSTEM_PROMPT,
      jsonMode: true,
    });

    const parsed = validators.askAIResponseSchema.parse(JSON.parse(responseText));
    success = true;
    return parsed;
  } catch (err: any) {
    errorMessage = err.message || "Unknown error";
    throw err;
  } finally {
    const latency = Date.now() - startTime;
    await logAIRequest(userId, role, "ask_ai", success, latency, errorMessage);
  }
}
