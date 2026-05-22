import { NextResponse } from "next/server";
import { generateVerdictSvg } from "@/lib/court/nft-svg";
import { connectToDatabase } from "@/lib/db/mongoose";
import { CaseModel } from "@/lib/db/models/Case";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { caseId: string; side: "plaintiff" | "defendant" } }
) {
  try {
    await connectToDatabase();
    const caseDoc = await CaseModel.findOne({ caseId: params.caseId });
    if (!caseDoc) {
      return new NextResponse("Not found", { status: 404 });
    }
    const side = params.side === "defendant" ? "defendant" : "plaintiff";
    const svg = generateVerdictSvg(caseDoc, side);
    return new NextResponse(svg, {
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "public, max-age=60"
      }
    });
  } catch {
    return new NextResponse("The court is in recess.", { status: 500 });
  }
}
