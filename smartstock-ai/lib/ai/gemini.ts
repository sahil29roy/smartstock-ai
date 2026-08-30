/**
 * Server-only Gemini API Client wrapper.
 * Communicates with the Google Generative Language API using pure fetch.
 */

const TIMEOUT_MS = 30000; // 30 seconds timeout

export interface GeminiOptions {
  systemInstruction?: string;
  jsonMode?: boolean;
}

/**
 * Sends a prompt and returns the text response from the Gemini API.
 */
export async function generateContent(
  prompt: string,
  options: GeminiOptions = {}
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    if (process.env.AI_MOCK === "true") {
      if (prompt.includes("BUSINESS_SUMMARY_PROMPT") || prompt.includes("Analyze the provided SmartStock dashboard")) {
        return JSON.stringify({
          summary: "SmartStock is operating normally with high revenue growth.",
          keyInsights: ["Top revenue is driven by AI Test Category.", "Low stock alerts are triggered."],
          risks: ["Low stock for SKU AI-TEST-SKU-777."],
          recommendations: ["Order more AI Test Product immediately."],
        });
      }
      
      if (prompt.includes("INVENTORY_ANALYSIS_PROMPT") || prompt.includes("Analyze the provided SmartStock inventory")) {
        const match = prompt.match(/"product_id":\s*"([^"]+)"/) || prompt.match(/"id":\s*"([^"]+)"/);
        const prodId = match ? match[1] : "test-product-id";
        return JSON.stringify({
          overallSummary: "Critical inventory status: 1 product is low on stock.",
          alertsCount: 1,
          products: {
            [prodId]: {
              riskLevel: "HIGH",
              summary: "Stock level is 2, which is below the minimum required 5.",
              reasons: ["High demand", "No recent procurements"],
              recommendations: ["Reorder 10 units from Supplier A."],
            },
          },
        });
      }

      if (prompt.includes("SALES_ANALYSIS_PROMPT") || prompt.includes("Analyze the provided SmartStock sales")) {
        return JSON.stringify({
          summary: "Sales performance is steady.",
          observations: ["Observation 1", "Observation 2"],
          trends: ["Trend 1", "Trend 2"],
          recommendations: ["Recommendation 1", "Recommendation 2"],
        });
      }

      if (prompt.includes("ASK_AI_PROMPT") || prompt.includes("Answer the user's question")) {
        return JSON.stringify({
          answer: "The AI Test Product (SKU: AI-TEST-SKU-777) currently has 2 units in stock, which is below the minimum threshold of 5.",
          sources: ["Inventory"],
          limitations: ["No financial ledger access for current role"],
        });
      }
    }

    console.error("Gemini client error: GEMINI_API_KEY is not defined in environment variables.");
    throw new Error("AI service is temporarily unavailable due to missing configuration.");
  }

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    ...(options.systemInstruction && {
      systemInstruction: {
        parts: [
          {
            text: options.systemInstruction,
          },
        ],
      },
    }),
    generationConfig: {
      temperature: 0.2, // Lower temperature for more factual responses
      ...(options.jsonMode && {
        responseMimeType: "application/json",
      }),
    },
  };

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(id);

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error(`Gemini API responded with status ${res.status}: ${errorText}`);
      throw new Error("Gemini API call failed.");
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("Gemini API returned an invalid response structure:", JSON.stringify(data));
      throw new Error("Received empty or invalid response structure from AI model.");
    }

    return text.trim();
  } catch (error: any) {
    clearTimeout(id);
    
    if (error.name === "AbortError") {
      console.error("Gemini API call timed out after 30 seconds.");
      throw new Error("AI service response timed out. Please try again.");
    }

    console.error("Gemini client connection error:", error);
    throw new Error(error.message || "An error occurred while communicating with the AI service.");
  }
}
