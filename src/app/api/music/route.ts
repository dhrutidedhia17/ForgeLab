import { generateMusic } from "@/lib/ai/lyria";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  const { prompt, buildId } = await request.json();
  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }
  const id = buildId || uuidv4();
  const { result, isMock } = await generateMusic(id, prompt);
  return NextResponse.json({ result, isMock });
}
