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
