import { GoogleGenAI } from "@google/genai";
import type { VendorResult, ResearchResult } from "@/types/pipeline";
import { getMockVendors } from "@/lib/mock/data";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function searchVendors(
  research: ResearchResult,
  category?: string
): Promise<{ result: VendorResult; isMock: boolean }> {
  if (!GEMINI_API_KEY) {
    return { result: getMockVendors(category), isMock: true };
  }

  try {
    const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const materialsList = research.materials
      .map((m) => `${m.name} (${m.specification})`)
      .join(", ");

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Search for suppliers and vendors for these building materials: ${materialsList}

For each material, find the top 3 online vendors/suppliers. Return valid JSON only (no markdown fences):

{
  "vendors": [
    {
      "material": "Material name",
      "suppliers": [
        {"name": "Store name", "url": "https://store-url.com", "priceRange": "$X-Y per unit"}
      ]
    }
  ]
}

Include real store names and realistic price ranges. Focus on major US retailers and specialty suppliers.`,
            },
          ],
        },
      ],
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    let jsonStr = text;
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1] || jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr) as VendorResult;
    return { result: parsed, isMock: false };
  } catch (error) {
    console.error("Vendor search error:", error);
    return { result: getMockVendors(category), isMock: true };
  }
}
