import { NextResponse } from "next/server";
import { z } from "zod";
import { serializeCase } from "@/lib/cases/serialize";
import { connectToDatabase } from "@/lib/db/mongoose";
import { CaseModel } from "@/lib/db/models/Case";
import { CounterModel } from "@/lib/db/models/Counter";
import { submitCaseFiled } from "@/lib/hedera/docket";
import { verifyCourtAntePayment } from "@/lib/hedera/verify-payment";
import { createCaseId } from "@/lib/utils";

export const runtime = "nodejs";

const FileCaseSchema = z.object({
  plaintiffId: z.string().regex(/^0\.0\.\d+$/),
  complaint: z.string().trim().min(3).max(280),
  paymentTxId: z.string().trim().min(6).max(140)
});

export async function POST(request: Request) {
  try {
    const input = FileCaseSchema.parse(await request.json());
    await connectToDatabase();

    const verifiedPayment = await verifyCourtAntePayment({
      txId: input.paymentTxId,
      expectedSender: input.plaintiffId
    });

    const counter = await CounterModel.findOneAndUpdate(
      { name: "caseNumber" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const caseDoc = await CaseModel.create({
      caseId: createCaseId(),
      caseNumber: counter.seq,
      plaintiffAccountId: verifiedPayment.senderAccountId,
      plaintiffPaymentTxId: verifiedPayment.txId,
      complaint: input.complaint,
      status: "awaiting_defense"
    });

    const hcsFiledTxId = await submitCaseFiled(caseDoc);
    caseDoc.hcsFiledTxId = hcsFiledTxId;
    await caseDoc.save();

    return NextResponse.json(serializeCase(caseDoc), { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "The court is in recess. Try again shortly.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
