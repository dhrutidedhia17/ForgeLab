import { generateBlueprint } from "@/lib/ai/draftaid";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  const { research, buildId, modelPath } = await request.json();
  if (!research) {
    return NextResponse.json({ error: "Research is required" }, { status: 400 });
  }
  const id = buildId || uuidv4();
  const { result, isMock } = await generateBlueprint(id, research, modelPath);
  return NextResponse.json({ result, isMock });
}
