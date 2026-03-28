import { NextResponse } from "next/server";
import { listVaultEntries, getVaultEntry } from "@/lib/vault/storage";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const result = await getVaultEntry(id);
    if (!result) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  }

  const entries = await listVaultEntries();
  return NextResponse.json({ builds: entries });
}
