import type { HydratedDocument } from "mongoose";
import { Hbar, TokenMintTransaction, TransferTransaction } from "@hiero-ledger/sdk";
import type { ICase } from "@/lib/db/models/Case";
import { getHederaClient } from "@/lib/hedera/client";
import { appendAgentKitAudit, runAgentTool, touchAgentKit } from "@/lib/hedera/agent";
import { isMockHederaAllowed } from "@/lib/utils";

type CaseDoc = HydratedDocument<ICase>;

export async function mintVerdictNft(
  caseDoc: CaseDoc,
  side: "plaintiff" | "defendant"
) {
  const agentKit = await touchAgentKit(`hts:mint:${side}`);

  const winner = caseDoc.verdict?.winner;
  const tokenId = process.env.HEDERA_VERDICT_TOKEN_ID;
  const verdict = winner === side ? "ACQUITTED" : "SENTENCED";

  if (isMockHederaAllowed() || !tokenId) {
    const minted = {
      txId: `demo-mint-${side}-${Date.now()}`,
      serial: Math.floor(Date.now() / 1000) % 100000
    };
    appendAgentKitAudit(caseDoc, {
      ...agentKit,
      label: `${sideLabel(side)} verdict NFT prepared through HTS`,
      service: "HTS",
      txId: minted.txId,
      occurredAt: new Date()
    });
    return minted;
  }

  const compactMetadata = Buffer.from(
    JSON.stringify({
      app: "The Hedera Court",
      caseId: caseDoc.caseId,
      side,
      verdict
    })
  );

  const client = getHederaClient();
  const response = await new TokenMintTransaction()
    .setTokenId(tokenId)
    .setMetadata([compactMetadata])
    .execute(client);
  const receipt = await response.getReceipt(client);
  const serial = receipt.serials?.[0]?.toNumber?.() ?? Number(receipt.serials?.[0] ?? 0);
  const txId = response.transactionId.toString();

  appendAgentKitAudit(caseDoc, {
    ...agentKit,
    label: `${sideLabel(side)} verdict NFT minted through HTS`,
    service: "HTS",
    txId,
    occurredAt: new Date()
  });

  return {
    txId,
    serial
  };
}

export async function payWinner(caseDoc: CaseDoc) {
  const action = "hbar:payout";

  const winner = caseDoc.verdict?.winner;
  const winnerAccount =
    winner === "plaintiff" ? caseDoc.plaintiffAccountId : caseDoc.defendantAccountId;
  const treasury = process.env.HEDERA_COURT_TREASURY_ID;

  if (!winner || !winnerAccount) {
    throw new Error("Cannot pay a winner before the verdict exists.");
  }

  if (isMockHederaAllowed() || !treasury) {
    const txId = `demo-payout-${caseDoc.caseId}-${Date.now()}`;
    appendAgentKitAudit(caseDoc, {
      ...(await touchAgentKit(action)),
      label: "Winner payout prepared as an HBAR transfer",
      service: "HBAR",
      txId,
      occurredAt: new Date()
    });
    return txId;
  }

  // Primary path: the autonomous court clerk settles the winner payout from the court
  // treasury through the Hedera Agent Kit's transfer_hbar_tool. amount is in whole HBAR
  // (0.95), matching the SDK fallback's 95,000,000 tinybars. Only treasury funds move
  // here; player wallets always sign their own antes in HashPack.
  try {
    const result = await runAgentTool(action, "transfer_hbar_tool", {
      transfers: [{ accountId: winnerAccount, amount: 0.95 }],
      sourceAccountId: treasury,
      transactionMemo: `The Hedera Court payout ${caseDoc.caseId}`
    });
    appendAgentKitAudit(caseDoc, {
      ...result.touch,
      label: "Winner payout sent as an HBAR transfer",
      service: "HBAR",
      txId: result.txId,
      occurredAt: new Date()
    });
    return result.txId as string;
  } catch (err) {
    console.warn("Agent Kit HBAR payout failed; falling back to SDK.", err);
  }

  // Fallback: deterministic SDK transfer so a slow or unavailable kit never strands a payout.
  const client = getHederaClient();
  const response = await new TransferTransaction()
    .addHbarTransfer(treasury, Hbar.fromTinybars(-95_000_000))
    .addHbarTransfer(winnerAccount, Hbar.fromTinybars(95_000_000))
    .setTransactionMemo(`The Hedera Court payout ${caseDoc.caseId}`)
    .execute(client);
  await response.getReceipt(client);
  const txId = response.transactionId.toString();
  appendAgentKitAudit(caseDoc, {
    ...(await touchAgentKit(action)),
    label: "Winner payout sent as an HBAR transfer",
    service: "HBAR",
    txId,
    occurredAt: new Date()
  });
  return txId;
}

function sideLabel(side: "plaintiff" | "defendant") {
  return side === "plaintiff" ? "Plaintiff" : "Defendant";
}
