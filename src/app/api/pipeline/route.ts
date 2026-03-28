import { v4 as uuidv4 } from "uuid";
import { createSSEStream, createSSEResponse } from "@/lib/pipeline/sse";
import { runPipeline } from "@/lib/pipeline/orchestrator";
import type { PipelineRequest } from "@/types/pipeline";
import { getOutputDir } from "@/lib/files";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max

export async function POST(request: Request) {
  const body = (await request.json()) as PipelineRequest;
  const { prompt, pdfBase64, imageBase64, imageMimeType, category } = body;

  if (!prompt?.trim()) {
    return new Response(JSON.stringify({ error: "Prompt is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const buildId = uuidv4();

  // Ensure output directory exists
  getOutputDir(buildId);

  const { stream, send, close } = createSSEStream();

  // Run pipeline in background (don't await)
  const pipelinePromise = runPipeline(buildId, prompt, category, send, pdfBase64, imageBase64, imageMimeType);

  // Set up heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    send({ event: "heartbeat", data: { ping: true } });
  }, 15000);

  // Clean up when pipeline completes
  pipelinePromise
    .catch((error) => {
      console.error("Pipeline error:", error);
      send({
        event: "pipeline",
        data: { status: "error", buildId, error: String(error) },
      });
    })
    .finally(() => {
      clearInterval(heartbeat);
      // Small delay to ensure final events are sent
      setTimeout(() => close(), 500);
    });

  return createSSEResponse(stream);
}
