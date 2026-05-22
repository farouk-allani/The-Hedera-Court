import { NextResponse } from "next/server";
import { serializeCase } from "@/lib/cases/serialize";
import { connectToDatabase } from "@/lib/db/mongoose";
import { CaseModel } from "@/lib/db/models/Case";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectToDatabase();
    const cases = await CaseModel.find({})
      .sort({ caseNumber: -1 })
      .limit(25);

    return NextResponse.json({ cases: cases.map(serializeCase) });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "The court is in recess. Try again shortly.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
