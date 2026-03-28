import { GoogleGenAI } from "@google/genai";
import type { ImageResult, ResearchResult } from "@/types/pipeline";
import { getMockImage, generateMockProductImageSVG } from "@/lib/mock/data";
import { saveFile } from "@/lib/files";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function generateImage(
  buildId: string,
  research: ResearchResult,
  prompt: string,
  imageBase64?: string,
  imageMimeType?: string
): Promise<{ result: ImageResult; isMock: boolean }> {
  if (!GEMINI_API_KEY) {
    // Save a mock SVG image
    const svg = generateMockProductImageSVG(research.title);
    await saveFile(buildId, "product.svg", svg);
    const mock = getMockImage(buildId);
    mock.filePath = `/outputs/${buildId}/product.svg`;
    mock.fileName = "product.svg";
    return { result: mock, isMock: true };
  }

  try {
    const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const materials = research.materials.map((m) => m.name).join(", ");

    // Build content parts
    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];

    if (imageBase64 && imageMimeType) {
      // When user uploaded a reference image, include it and ask to recreate faithfully
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: imageMimeType,
        },
      });
      parts.push({
        text: `Generate a photorealistic studio product image that looks EXACTLY like the uploaded reference image above. This is the product the user wants to build/recreate.

Recreate this item faithfully — same shape, same proportions, same style, same colors, same design details. Show it as a finished product photographed in a professional studio setting with clean white background and professional lighting.

Materials used: ${materials}.
Product: ${prompt}.

The generated image MUST closely match the reference image. Do NOT change the design, style, or proportions. 4K quality, catalog photography.`,
      });
    } else {
      // Text-only prompt
      parts.push({
        text: `Photorealistic studio render of a finished ${prompt}. Materials: ${materials}. Key features: ${research.overview}. Clean white background, professional product photography lighting, high-end catalog quality, 4K detail.`,
      });
    }

    const response = await client.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      config: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });

    // Extract image from response
    const responseParts = response.candidates?.[0]?.content?.parts || [];
    for (const part of responseParts) {
      if (part.inlineData) {
        const imageData = Buffer.from(part.inlineData.data || "", "base64");
        const mimeType = part.inlineData.mimeType || "image/png";
        const ext = mimeType.includes("png") ? "png" : "jpg";
        const fileName = `product.${ext}`;
        const filePath = await saveFile(buildId, fileName, imageData);
        return {
          result: { filePath, fileName },
          isMock: false,
        };
      }
    }

    throw new Error("No image generated in response");
  } catch (error) {
    console.error("Image generation error:", error);
    const svg = generateMockProductImageSVG(research.title);
    await saveFile(buildId, "product.svg", svg);
    const mock = getMockImage(buildId);
    mock.filePath = `/outputs/${buildId}/product.svg`;
    mock.fileName = "product.svg";
    return { result: mock, isMock: true };
  }
}
