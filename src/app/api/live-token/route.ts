import { generateEphemeralToken, buildWebSocketUrl, LIVE_MODEL } from "@/lib/ai/live";
import { NextResponse } from "next/server";

/**
 * POST /api/live-token
 * Returns an ephemeral token and WebSocket URL for client-side Live API connections.
 */
export async function POST() {
  const { token, error } = await generateEphemeralToken();

  if (!token) {
    return NextResponse.json(
      { error: error || "Failed to generate token", available: false },
      { status: 503 }
    );
  }

  return NextResponse.json({
    wsUrl: buildWebSocketUrl(token),
    model: LIVE_MODEL,
    available: true,
  });
}
