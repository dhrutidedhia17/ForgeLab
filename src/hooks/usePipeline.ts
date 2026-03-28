"use client";

import { useState, useCallback, useRef } from "react";
import type { StepName, StepResult, StepStatus, PipelineState } from "@/types/pipeline";

const INITIAL_STEPS: Record<StepName, StepResult> = {
  research: { step: "research", status: "pending" },
  vendors: { step: "vendors", status: "pending" },
  model3d: { step: "model3d", status: "pending" },
  blueprint: { step: "blueprint", status: "pending" },
  image: { step: "image", status: "pending" },
  video: { step: "video", status: "pending" },
};

export function usePipeline() {
  const [state, setState] = useState<PipelineState>({
    buildId: "",
    prompt: "",
    category: "",
    steps: { ...INITIAL_STEPS },
    status: "idle",
  });

  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState<string>("");
  const startTimeRef = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);

  const updateStep = useCallback((stepResult: StepResult) => {
    setState((prev) => ({
      ...prev,
      steps: {
        ...prev.steps,
        [stepResult.step]: stepResult,
      },
    }));
  }, []);

  const updateEstimate = useCallback(() => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    // Rough estimate: research ~10s, parallel steps ~30s each, total ~45s with mocks
    const totalEstimate = 60;
    const remaining = Math.max(0, totalEstimate - elapsed);
    if (remaining > 0) {
      const mins = Math.floor(remaining / 60);
      const secs = Math.ceil(remaining % 60);
      setEstimatedTimeLeft(
        mins > 0 ? `~${mins}m ${secs}s remaining` : `~${secs}s remaining`
      );
    } else {
      setEstimatedTimeLeft("Almost done...");
    }
  }, []);

  const run = useCallback(
    async (prompt: string, category: string, pdfBase64?: string, imageBase64?: string, imageMimeType?: string) => {
      // Reset state
      setState({
        buildId: "",
        prompt,
        category,
        steps: { ...INITIAL_STEPS },
        status: "running",
      });
      startTimeRef.current = Date.now();

      // Set up time estimation
      const estimateInterval = setInterval(updateEstimate, 2000);

      // Abort any previous request
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch("/api/pipeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, pdfBase64, imageBase64, imageMimeType, category }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Pipeline request failed: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE frames
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          let eventType = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              const dataStr = line.slice(6);
              try {
                const data = JSON.parse(dataStr);
                if (eventType === "step") {
                  updateStep(data as StepResult);
                } else if (eventType === "pipeline") {
                  const pipelineData = data as {
                    status: string;
                    buildId?: string;
                    error?: string;
                  };
                  setState((prev) => ({
                    ...prev,
                    buildId: pipelineData.buildId || prev.buildId,
                    status: pipelineData.status as PipelineState["status"],
                  }));
                }
                // Ignore heartbeat events
              } catch {
                // Invalid JSON, skip
              }
              eventType = "";
            }
          }
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Pipeline SSE error:", error);
          setState((prev) => ({
            ...prev,
            status: "error",
          }));
        }
      } finally {
        clearInterval(estimateInterval);
        setEstimatedTimeLeft("");
      }
    },
    [updateStep, updateEstimate]
  );

  const stepStatuses: Record<StepName, StepStatus> = {
    research: state.steps.research.status,
    vendors: state.steps.vendors.status,
    model3d: state.steps.model3d.status,
    blueprint: state.steps.blueprint.status,
    image: state.steps.image.status,
    video: state.steps.video.status,
  };

  return {
    state,
    stepStatuses,
    estimatedTimeLeft,
    isRunning: state.status === "running",
    isComplete: state.status === "complete",
    run,
  };
}
