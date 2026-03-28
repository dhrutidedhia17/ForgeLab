import { generateVideo } from "@/lib/ai/veo";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  const { prompt, research, buildId } = await request.json();
  if (!prompt || !research) {
    return NextResponse.json({ error: "Prompt and research are required" }, { status: 400 });
  }
  const id = buildId || uuidv4();
  const { result, isMock } = await generateVideo(id, research, prompt);
  return NextResponse.json({ result, isMock });
}
