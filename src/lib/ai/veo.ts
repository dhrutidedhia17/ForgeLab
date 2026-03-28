import { GoogleGenAI } from "@google/genai";
import type { VideoResult, ResearchResult } from "@/types/pipeline";
import { getMockVideo } from "@/lib/mock/data";
import { generateMusic } from "@/lib/ai/lyria";
import { saveFile } from "@/lib/files";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateVideo(
  buildId: string,
  research: ResearchResult,
  prompt: string
): Promise<{ result: VideoResult; isMock: boolean }> {
  // Generate music in parallel with video
  const musicPromise = generateMusic(buildId, prompt);

  let videoResult: VideoResult;
  let videoIsMock = true;

  if (!GEMINI_API_KEY) {
    videoResult = getMockVideo(buildId);
    videoIsMock = true;
  } else {
    try {
      const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const clips: { filePath: string; fileName: string; description: string }[] = [];

      const clipPrompts = [
        {
          prompt: `A cinematic overview shot of a completed ${prompt}. Slowly rotating camera showing the finished product from multiple angles. Professional studio lighting, clean background. High quality product photography video.`,
          description: "Overview of the finished product",
          fileName: "video_1.mp4",
        },
        {
          prompt: `Close-up detailed shot of ${prompt} focusing on craftsmanship details, textures, joints, and material quality. Smooth camera movement revealing fine details. Studio lighting, shallow depth of field.`,
          description: "Detail close-up",
          fileName: "video_2.mp4",
        },
        {
          prompt: `Beautiful final reveal of the completed ${prompt} in a styled room setting. Camera slowly pulls back to show the product in a real-life context. Warm natural lighting, aesthetic interior.`,
          description: "Final reveal with styling",
          fileName: "video_3.mp4",
        },
      ];

      // Generate clips sequentially (API rate limits)
      for (const clipInfo of clipPrompts) {
        try {
          console.log(`[Veo] Generating clip: ${clipInfo.description}`);

          // Use Veo via Gemini API (try Veo 3, fallback to Veo 2)
          let operation;
          try {
            operation = await client.models.generateVideos({
              model: "veo-3.0-generate-preview",
              prompt: clipInfo.prompt,
              config: {
                aspectRatio: "16:9",
                numberOfVideos: 1,
                durationSeconds: 8,
                personGeneration: "dont_allow",
                enhancePrompt: true,
              },
            });
          } catch {
            console.log(`[Veo] Veo 3 not available, trying Veo 2...`);
            operation = await client.models.generateVideos({
              model: "veo-2.0-generate-001",
              prompt: clipInfo.prompt,
              config: {
                aspectRatio: "16:9",
                numberOfVideos: 1,
                durationSeconds: 8,
                personGeneration: "dont_allow",
                enhancePrompt: true,
              },
            });
          }

          // Poll for completion (up to 5 minutes per clip)
          console.log(`[Veo] Operation started: ${operation.name}`);

          while (!operation.done) {
            await sleep(10000);
            operation = await client.operations.getVideosOperation({
              operation: operation,
            });
            console.log(`[Veo] Polling ${clipInfo.description}...`);
          }

          console.log(`[Veo] Clip complete: ${clipInfo.description}`);
          console.log(`[Veo] Response keys:`, JSON.stringify(Object.keys(operation.response || {})));
          console.log(`[Veo] Generated videos count:`, operation.response?.generatedVideos?.length || 0);

          if (operation.done && operation.response?.generatedVideos?.length) {
            const video = operation.response.generatedVideos[0];
            console.log(`[Veo] Video object keys:`, JSON.stringify(Object.keys(video || {})));
            console.log(`[Veo] video.video keys:`, JSON.stringify(Object.keys(video.video || {})));

            // Try URI-based download first
            if (video.video?.uri) {
              const videoResponse = await fetch(video.video.uri);
              if (videoResponse.ok) {
                const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
                const filePath = await saveFile(buildId, clipInfo.fileName, videoBuffer);
                clips.push({
                  filePath,
                  fileName: clipInfo.fileName,
                  description: clipInfo.description,
                });
                console.log(`[Veo] Saved from URI: ${clipInfo.fileName} (${(videoBuffer.length / 1024).toFixed(0)} KB)`);
                continue;
              }
            }

            // Try inline base64 data
            if (video.video?.videoBytes) {
              const videoBuffer = Buffer.from(video.video.videoBytes, "base64");
              const filePath = await saveFile(buildId, clipInfo.fileName, videoBuffer);
              clips.push({
                filePath,
                fileName: clipInfo.fileName,
                description: clipInfo.description,
              });
              console.log(`[Veo] Saved from base64: ${clipInfo.fileName} (${(videoBuffer.length / 1024).toFixed(0)} KB)`);
              continue;
            }

            console.log(`[Veo] No video data found. Full video object:`, JSON.stringify(video).slice(0, 500));
          }

          // If we get here, generation failed or timed out
          clips.push({
            filePath: `/outputs/${buildId}/${clipInfo.fileName}`,
            fileName: clipInfo.fileName,
            description: `${clipInfo.description} (generation timeout)`,
          });
        } catch (clipError) {
          console.error(`[Veo] Clip error for ${clipInfo.fileName}:`, clipError);
          clips.push({
            filePath: `/outputs/${buildId}/${clipInfo.fileName}`,
            fileName: clipInfo.fileName,
            description: `${clipInfo.description} (error)`,
          });
        }
      }

      videoResult = { clips };
      videoIsMock = clips.every((c) => c.description.includes("(error)") || c.description.includes("(timeout)"));
    } catch (error) {
      console.error("[Veo] Video generation error:", error);
      videoResult = getMockVideo(buildId);
      videoIsMock = true;
    }
  }

  // Wait for music to finish and attach it
  try {
    const { result: musicResult, isMock: musicIsMock } = await musicPromise;
    videoResult.music = {
      filePath: musicResult.filePath,
      fileName: musicResult.fileName,
      duration: musicResult.duration,
    };
    if (musicIsMock && videoIsMock) {
      videoIsMock = true;
    } else {
      videoIsMock = false;
    }
  } catch (error) {
    console.error("Music generation error within video step:", error);
  }

  return {
    result: videoResult,
    isMock: videoIsMock,
  };
}
