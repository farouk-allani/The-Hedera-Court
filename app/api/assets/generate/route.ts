import { NextResponse } from "next/server";
import { generateAssets } from "@/lib/assets/generate-assets";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  try {
    const result = await generateAssets();
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "The asset clerk spilled ink.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
