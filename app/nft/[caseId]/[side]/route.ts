import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { CaseModel } from "@/lib/db/models/Case";
import { verdictLabel } from "@/lib/court/seal";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { caseId: string; side: "plaintiff" | "defendant" } }
) {
  try {
    await connectToDatabase();
    const caseDoc = await CaseModel.findOne({ caseId: params.caseId });
    if (!caseDoc || !caseDoc.verdict?.winner) {
      return NextResponse.json({ error: "NFT metadata not found" }, { status: 404 });
    }

    const side = params.side === "defendant" ? "defendant" : "plaintiff";
    const label = verdictLabel(caseDoc.verdict.winner, side);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    return NextResponse.json({
      name: `Case #${caseDoc.caseNumber} - ${caseDoc.verdict.caseName} - ${label}`,
      description: caseDoc.verdict.ruling,
      image: `${appUrl}/nft/${caseDoc.caseId}/${side}.svg`,
      creator: "The Hedera Court",
      attributes: [
        {
          trait_type: "Verdict",
          value: label
        },
        {
          trait_type: "Case Number",
          value: String(caseDoc.caseNumber)
        },
        {
          trait_type: "Loser Crime",
          value: caseDoc.verdict.loserCrime
        }
      ]
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "The court is in recess. Try again shortly.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
