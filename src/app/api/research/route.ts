import { generateResearch } from "@/lib/ai/gemini";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { prompt, category, pdfBase64 } = await request.json();
  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }
  const { result, isMock } = await generateResearch(prompt, category || "Other", pdfBase64);
  return NextResponse.json({ result, isMock });
}
