import { NextResponse } from "next/server";
import { z } from "zod";
import { serializeCase } from "@/lib/cases/serialize";
import { runRulingPipeline } from "@/lib/court/ruling-pipeline";
import { connectToDatabase } from "@/lib/db/mongoose";
import { CaseModel } from "@/lib/db/models/Case";
import { submitDefenseFiled } from "@/lib/hedera/docket";
import { verifyCourtAntePayment } from "@/lib/hedera/verify-payment";

export const runtime = "nodejs";
export const maxDuration = 60;

const DefendCaseSchema = z.object({
  defendantId: z.string().regex(/^0\.0\.\d+$/),
  defense: z.string().trim().min(2).max(280),
  paymentTxId: z.string().trim().min(6).max(140)
});

export async function POST(
  request: Request,
  { params }: { params: { caseId: string } }
) {
  try {
    const input = DefendCaseSchema.parse(await request.json());
    await connectToDatabase();

    const caseDoc = await CaseModel.findOne({ caseId: params.caseId });
    if (!caseDoc) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }
    if (caseDoc.status !== "awaiting_defense") {
      return NextResponse.json(
        { error: "This matter is no longer accepting pleas." },
        { status: 409 }
      );
    }
    if (caseDoc.plaintiffAccountId === input.defendantId) {
      return NextResponse.json(
        { error: "The plaintiff cannot also be the defendant." },
        { status: 400 }
      );
    }

    const verifiedPayment = await verifyCourtAntePayment({
      txId: input.paymentTxId,
      expectedSender: input.defendantId
    });

    caseDoc.defendantAccountId = verifiedPayment.senderAccountId;
    caseDoc.defendantPaymentTxId = verifiedPayment.txId;
    caseDoc.defense = input.defense;
    caseDoc.status = "ruling";
    await caseDoc.save();

    caseDoc.hcsDefenseTxId = await submitDefenseFiled(caseDoc);
    await caseDoc.save();

    const ruledCase = await runRulingPipeline(caseDoc.caseId);
    return NextResponse.json(serializeCase(ruledCase));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "The court is in recess. Try again shortly.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
