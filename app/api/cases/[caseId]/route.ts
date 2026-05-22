import { NextResponse } from "next/server";
import { serializeCase } from "@/lib/cases/serialize";
import { connectToDatabase } from "@/lib/db/mongoose";
import { CaseModel } from "@/lib/db/models/Case";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { caseId: string } }
) {
  try {
    await connectToDatabase();
    const caseDoc = await CaseModel.findOne({ caseId: params.caseId });
    if (!caseDoc) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }
    return NextResponse.json(serializeCase(caseDoc));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "The court is in recess. Try again shortly.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
