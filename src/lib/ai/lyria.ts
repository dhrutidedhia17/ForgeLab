import { GoogleGenAI } from "@google/genai";
import { getMockMusic } from "@/lib/mock/data";
import { saveFile } from "@/lib/files";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export interface MusicGenerationResult {
  filePath: string;
  fileName: string;
  duration: string;
}

export async function generateMusic(
  buildId: string,
  prompt: string
): Promise<{ result: MusicGenerationResult; isMock: boolean }> {
  if (!GEMINI_API_KEY) {
    return { result: getMockMusic(buildId), isMock: true };
  }

  try {
    const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const musicPrompt = `Generate instrumental background music for a DIY build tutorial about: ${prompt}.
The music should be focused and calm, light acoustic guitar or ambient electronic, suitable for a workshop tutorial video. 30 seconds duration.`;

    const response = await client.models.generateContent({
      model: "lyria-3-clip-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: musicPrompt }],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
      },
    });

    // Extract audio from response
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        const audioData = Buffer.from(part.inlineData.data, "base64");
        const mimeType = part.inlineData.mimeType || "audio/mp3";
        const ext = mimeType.includes("wav") ? "wav" : "mp3";
        const fileName = `music.${ext}`;
        const filePath = await saveFile(buildId, fileName, audioData);
        return {
          result: { filePath, fileName, duration: "30 seconds" },
          isMock: false,
        };
      }
    }

    throw new Error("No audio generated in response");
  } catch (error) {
    console.error("Lyria music generation error:", error);
    return { result: getMockMusic(buildId), isMock: true };
  }
}
