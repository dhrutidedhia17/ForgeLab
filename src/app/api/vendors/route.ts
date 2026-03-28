import { searchVendors } from "@/lib/ai/vendors";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { research } = await request.json();
  if (!research) {
    return NextResponse.json({ error: "Research result is required" }, { status: 400 });
  }
  const { result, isMock } = await searchVendors(research);
  return NextResponse.json({ result, isMock });
}
