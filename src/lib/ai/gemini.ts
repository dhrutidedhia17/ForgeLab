import { GoogleGenAI } from "@google/genai";
import type { ResearchResult } from "@/types/pipeline";
import { getMockResearch } from "@/lib/mock/data";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function getClient() {
  if (!GEMINI_API_KEY) return null;
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

export async function generateResearch(
  prompt: string,
  category: string,
  pdfBase64?: string,
  imageBase64?: string,
  imageMimeType?: string
): Promise<{ result: ResearchResult; isMock: boolean }> {
  const client = getClient();
  if (!client) {
    return { result: getMockResearch(prompt, category, !!(imageBase64 && imageMimeType)), isMock: true };
  }

  try {
    let inputText = prompt;
    let imageAnalysis = "";

    // If an image is provided, analyze it first using Gemini vision
    if (imageBase64 && imageMimeType) {
      const imageResponse = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: imageMimeType,
                  data: imageBase64,
                },
              },
              {
                text: `Analyze this product image in detail. Identify:
1. What the product is (e.g. blouse, chair, shelf, etc.)
2. Materials it's made from (fabric type, wood type, metal, etc.)
3. Construction details (seams, joints, fasteners, stitching patterns, etc.)
4. Dimensions (estimate from the image)
5. Color, pattern, and design details
6. Any special features or techniques used

Be as specific as possible — this analysis will be used to create a step-by-step guide to recreate this exact product from scratch.`,
              },
            ],
          },
        ],
      });
      imageAnalysis = imageResponse.text || "";

      // Combine user prompt with image analysis
      inputText = `${prompt}\n\nImage Analysis:\n${imageAnalysis}`;
    }

    // If PDF is provided, extract text from it using Gemini
    if (pdfBase64) {
      const pdfResponse = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: pdfBase64,
                },
              },
              {
                text: "Extract all relevant information from this PDF manual including: product name, dimensions, materials list, tools needed, assembly steps, and any specifications. Return as structured text.",
              },
            ],
          },
        ],
      });
      inputText = pdfResponse.text || prompt;
    }

    const isImageBased = !!(imageBase64 && imageMimeType);

    const systemPrompt = `You are ForgeLab, an expert AI that creates comprehensive build/make guides for physical products.
${isImageBased ? `The user has uploaded an image of a product they want to recreate. An AI vision system has already analyzed the image — use that analysis along with the user's notes to create a complete step-by-step guide to build/make this exact product from scratch.` : `Given the user's request, generate a detailed build guide.`}

You MUST respond with valid JSON only, no markdown fences.

The JSON must have this exact structure:
{
  "title": "Build Guide: [Product Name]",
  "overview": "2-3 sentence description of the project and what the finished product looks like",
  "materials": [{"name": "material name", "quantity": "amount", "specification": "details/dimensions/type"}],
  "tools": ["tool1", "tool2"],
  "steps": [{"stepNumber": 1, "title": "Step title", "description": "Detailed step description with specific measurements and techniques"}],
  "safetyNotes": ["note1", "note2"],
  "estimatedTime": "X-Y hours",
  "difficulty": "Beginner|Intermediate|Advanced",
  "rawGuide": "Full text summary of the entire build process"
}

Category: ${category}
${isImageBased ? `IMPORTANT: Base your guide on the image analysis provided. Include exact materials (fabric types, thread counts, etc.), cutting dimensions, and construction techniques needed to recreate this product.` : `Include realistic dimensions, specific material grades, and practical construction techniques.`}
${category === "Clothing" ? `\nSIZING RULES: If the user specifies a size (S, M, L, XL, etc.) or custom measurements (bust, waist, hips in cm), include those EXACT measurements in material specifications and step descriptions. Every cutting dimension must use the actual body measurements plus seam allowance (1.5cm). If no size is given, default to M (Bust: 88cm, Waist: 70cm, Hips: 94cm) and state this in the overview.` : ``}`;

    // Build the content parts
    const contentParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    // Include the image again in the final request so Gemini can reference it
    if (imageBase64 && imageMimeType) {
      contentParts.push({
        inlineData: {
          mimeType: imageMimeType,
          data: imageBase64,
        },
      });
    }

    contentParts.push({ text: `${systemPrompt}\n\nUser request: ${inputText}` });

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: contentParts,
        },
      ],
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    // Extract JSON from the response
    let jsonStr = text;
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1] || jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr) as ResearchResult;
    return { result: parsed, isMock: false };
  } catch (error) {
    console.error("Gemini research error:", error);
    return { result: getMockResearch(prompt, category, !!(imageBase64 && imageMimeType)), isMock: true };
  }
}
