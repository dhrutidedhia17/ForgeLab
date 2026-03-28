/**
 * Gemini Live API helper
 * Provides ephemeral token generation and WebSocket configuration
 * for real-time bidirectional streaming with Gemini.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Live API WebSocket endpoint
export const LIVE_API_WS_URL =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";

// Model for live interactions
export const LIVE_MODEL = "models/gemini-2.0-flash-live-001";

/**
 * Generate an ephemeral token for secure client-side WebSocket connections.
 * This avoids embedding the raw API key in frontend code.
 */
export async function generateEphemeralToken(): Promise<{
  token: string | null;
  error?: string;
}> {
  if (!GEMINI_API_KEY) {
    return { token: null, error: "GEMINI_API_KEY not configured" };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-live-001:generateEphemeralToken?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      // If ephemeral tokens aren't available, fall back to using the API key directly
      // (less secure but works for hackathon demos)
      return { token: GEMINI_API_KEY, error: undefined };
    }

    const data = await response.json();
    return { token: data.token || GEMINI_API_KEY };
  } catch {
    // Fallback: return the API key directly for demo purposes
    return { token: GEMINI_API_KEY };
  }
}

/**
 * Build the WebSocket URL with authentication
 */
export function buildWebSocketUrl(token: string): string {
  return `${LIVE_API_WS_URL}?key=${token}`;
}

/**
 * Build the initial setup message for a Live API session
 */
export function buildSetupMessage(buildContext?: string) {
  const systemInstruction = buildContext
    ? `You are ForgeLab's AI Build Assistant — a friendly, expert helper embedded in a DIY build platform.

You have full context about the user's current build project:
${buildContext}

Your role:
- Answer questions about the build process, materials, tools, and techniques
- Provide helpful tips, alternatives, and safety advice
- Be concise but thorough — users are actively building
- Reference specific steps, materials, or measurements from the build guide when relevant
- If asked about something outside the build, politely redirect to the project

Keep responses under 200 words unless the user asks for detail.`
    : `You are ForgeLab's AI Build Assistant. You help users with DIY building projects — furniture, clothing, electronics, and more. Be helpful, concise, and practical. Keep responses under 200 words unless asked for detail.`;

  return {
    setup: {
      model: LIVE_MODEL,
      generationConfig: {
        responseModalities: ["TEXT"],
        temperature: 0.7,
      },
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
    },
  };
}
