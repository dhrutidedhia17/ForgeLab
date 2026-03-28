import type { StepName, StepResult, ResearchResult, SSEEvent } from "@/types/pipeline";
import { generateResearch } from "@/lib/ai/gemini";
import { searchVendors } from "@/lib/ai/vendors";
import { generateModel } from "@/lib/ai/zoo";
import { generateBlueprint } from "@/lib/ai/draftaid";
import { generateImage } from "@/lib/ai/image";
import { generateVideo } from "@/lib/ai/veo";
import { saveVaultEntry } from "@/lib/vault/storage";

type SendFn = (event: SSEEvent) => void;

function sendStepUpdate(send: SendFn, step: StepName, status: StepResult["status"], result?: StepResult["result"], error?: string, isMock?: boolean) {
  const stepResult: StepResult = { step, status, result, error, isMock };
  send({ event: "step", data: stepResult });
}

export async function runPipeline(
  buildId: string,
  prompt: string,
  category: string,
  send: SendFn,
  pdfBase64?: string,
  imageBase64?: string,
  imageMimeType?: string
) {
  // Notify pipeline started
  send({ event: "pipeline", data: { status: "running", buildId } });

  let researchResult: ResearchResult | null = null;
  let researchIsMock = false;

  // Step 1: Research (sequential — all other steps depend on this)
  sendStepUpdate(send, "research", "running");
  try {
    const { result, isMock } = await generateResearch(prompt, category, pdfBase64, imageBase64, imageMimeType);
    researchResult = result;
    researchIsMock = isMock;
    sendStepUpdate(send, "research", "complete", result, undefined, isMock);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Research failed";
    sendStepUpdate(send, "research", "error", undefined, errMsg);
    send({ event: "pipeline", data: { status: "error", buildId, error: errMsg } });
    return;
  }

  // Steps 2-7: Run in parallel
  const parallelSteps = [
    // Vendors
    async (): Promise<StepResult> => {
      sendStepUpdate(send, "vendors", "running");
      try {
        const { result, isMock } = await searchVendors(researchResult!, category);
        sendStepUpdate(send, "vendors", "complete", result, undefined, isMock);
        return { step: "vendors", status: "complete", result, isMock };
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Vendor search failed";
        sendStepUpdate(send, "vendors", "error", undefined, errMsg);
        return { step: "vendors", status: "error", error: errMsg };
      }
    },
    // 3D Model
    async (): Promise<StepResult> => {
      sendStepUpdate(send, "model3d", "running");
      try {
        const { result, isMock } = await generateModel(buildId, researchResult!, prompt, category);
        sendStepUpdate(send, "model3d", "complete", result, undefined, isMock);
        return { step: "model3d", status: "complete", result, isMock };
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "3D model generation failed";
        sendStepUpdate(send, "model3d", "error", undefined, errMsg);
        return { step: "model3d", status: "error", error: errMsg };
      }
    },
    // Blueprint
    async (): Promise<StepResult> => {
      sendStepUpdate(send, "blueprint", "running");
      try {
        const { result, isMock } = await generateBlueprint(buildId, researchResult!, undefined, category);
        sendStepUpdate(send, "blueprint", "complete", result, undefined, isMock);
        return { step: "blueprint", status: "complete", result, isMock };
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Blueprint generation failed";
        sendStepUpdate(send, "blueprint", "error", undefined, errMsg);
        return { step: "blueprint", status: "error", error: errMsg };
      }
    },
    // Image
    async (): Promise<StepResult> => {
      sendStepUpdate(send, "image", "running");
      try {
        const { result, isMock } = await generateImage(buildId, researchResult!, prompt, imageBase64, imageMimeType);
        sendStepUpdate(send, "image", "complete", result, undefined, isMock);
        return { step: "image", status: "complete", result, isMock };
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Image generation failed";
        sendStepUpdate(send, "image", "error", undefined, errMsg);
        return { step: "image", status: "error", error: errMsg };
      }
    },
    // Video (includes background music generation)
    async (): Promise<StepResult> => {
      sendStepUpdate(send, "video", "running");
      try {
        const { result, isMock } = await generateVideo(buildId, researchResult!, prompt);
        sendStepUpdate(send, "video", "complete", result, undefined, isMock);
        return { step: "video", status: "complete", result, isMock };
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Video generation failed";
        sendStepUpdate(send, "video", "error", undefined, errMsg);
        return { step: "video", status: "error", error: errMsg };
      }
    },
  ];

  const results = await Promise.allSettled(parallelSteps.map((fn) => fn()));

  // Collect all results for vault entry
  const allResults: Record<string, StepResult> = {
    research: { step: "research", status: "complete", result: researchResult!, isMock: researchIsMock },
  };

  for (const settled of results) {
    if (settled.status === "fulfilled") {
      allResults[settled.value.step] = settled.value;
    }
  }

  // Save to vault
  try {
    await saveVaultEntry(buildId, prompt, category, researchResult!, allResults);
  } catch (error) {
    console.error("Failed to save vault entry:", error);
  }

  // Notify pipeline complete
  send({ event: "pipeline", data: { status: "complete", buildId } });
}
