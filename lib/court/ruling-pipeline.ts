import { serializeCase } from "@/lib/cases/serialize";
import { deliberateAndRule } from "@/lib/court/justice";
import { connectToDatabase } from "@/lib/db/mongoose";
import { CaseModel } from "@/lib/db/models/Case";
import { submitVerdict } from "@/lib/hedera/docket";
import { mintVerdictNft, payWinner } from "@/lib/hedera/nft";

export async function runRulingPipeline(caseId: string) {
  await connectToDatabase();
  const caseDoc = await CaseModel.findOne({ caseId });
  if (!caseDoc) {
    throw new Error("Case not found");
  }

  try {
    if (!caseDoc.pipelineState?.verdictGenerated) {
      const verdict = await deliberateAndRule(caseDoc.complaint, caseDoc.defense ?? "");
      caseDoc.verdict = verdict;
      caseDoc.pipelineState = {
        ...caseDoc.pipelineState,
        verdictGenerated: true
      };
      caseDoc.status = "ruling";
      await caseDoc.save();
    }

    if (!caseDoc.pipelineState?.plaintiffNftMinted) {
      const minted = await mintVerdictNft(caseDoc, "plaintiff");
      caseDoc.plaintiffNftMintTxId = minted.txId;
      caseDoc.plaintiffNftSerial = minted.serial;
      caseDoc.pipelineState = {
        ...caseDoc.pipelineState,
        plaintiffNftMinted: true
      };
      await caseDoc.save();
    }

    if (!caseDoc.pipelineState?.defendantNftMinted) {
      const minted = await mintVerdictNft(caseDoc, "defendant");
      caseDoc.defendantNftMintTxId = minted.txId;
      caseDoc.defendantNftSerial = minted.serial;
      caseDoc.pipelineState = {
        ...caseDoc.pipelineState,
        defendantNftMinted: true
      };
      await caseDoc.save();
    }

    if (!caseDoc.pipelineState?.payoutSent) {
      caseDoc.payoutTxId = await payWinner(caseDoc);
      caseDoc.pipelineState = {
        ...caseDoc.pipelineState,
        payoutSent: true
      };
      await caseDoc.save();
    }

    if (!caseDoc.pipelineState?.verdictHcsSubmitted) {
      caseDoc.hcsVerdictTxId = await submitVerdict(caseDoc);
      caseDoc.pipelineState = {
        ...caseDoc.pipelineState,
        verdictHcsSubmitted: true
      };
      await caseDoc.save();
    }

    caseDoc.status = "ruled";
    caseDoc.ruledAt = new Date();
    await caseDoc.save();
    return caseDoc;
  } catch (err) {
    caseDoc.status = "stuck";
    await caseDoc.save();
    const publicCase = serializeCase(caseDoc);
    const message = err instanceof Error ? err.message : "Unknown ruling pipeline failure";
    throw new Error(`${message}. Pipeline state saved for ${publicCase.caseId}.`);
  }
}
