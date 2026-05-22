import type { HydratedDocument } from "mongoose";
import { TopicMessageSubmitTransaction } from "@hiero-ledger/sdk";
import type { ICase } from "@/lib/db/models/Case";
import { getHederaClient } from "@/lib/hedera/client";
import { appendAgentKitAudit, touchAgentKit } from "@/lib/hedera/agent";
import { isMockHederaAllowed, nowSeconds, sha256 } from "@/lib/utils";

type CaseDoc = HydratedDocument<ICase>;

export async function submitCaseFiled(caseDoc: CaseDoc) {
  const { txId, agentKit } = await submitDocketMessage({
    v: 1,
    type: "CASE_FILED",
    caseId: caseDoc.caseId,
    caseNumber: caseDoc.caseNumber,
    complaint: caseDoc.complaint,
    plaintiffHash: sha256(caseDoc.plaintiffAccountId),
    ts: nowSeconds()
  });
  appendAgentKitAudit(caseDoc, {
    ...agentKit,
    label: "Case filed on the HCS public docket",
    service: "HCS",
    txId,
    occurredAt: new Date()
  });
  return txId;
}

export async function submitDefenseFiled(caseDoc: CaseDoc) {
  const { txId, agentKit } = await submitDocketMessage({
    v: 1,
    type: "DEFENSE_FILED",
    caseId: caseDoc.caseId,
    caseNumber: caseDoc.caseNumber,
    defense: caseDoc.defense,
    defendantHash: sha256(caseDoc.defendantAccountId ?? ""),
    ts: nowSeconds()
  });
  appendAgentKitAudit(caseDoc, {
    ...agentKit,
    label: "Defense filed on the HCS public docket",
    service: "HCS",
    txId,
    occurredAt: new Date()
  });
  return txId;
}

export async function submitVerdict(caseDoc: CaseDoc) {
  const { txId, agentKit } = await submitDocketMessage({
    v: 1,
    type: "VERDICT",
    caseId: caseDoc.caseId,
    caseNumber: caseDoc.caseNumber,
    caseName: caseDoc.verdict?.caseName,
    ruling: caseDoc.verdict?.ruling,
    sentence: caseDoc.verdict?.sentence,
    winner: caseDoc.verdict?.winner,
    plaintiffNftSerial: caseDoc.plaintiffNftSerial,
    defendantNftSerial: caseDoc.defendantNftSerial,
    payoutTxId: caseDoc.payoutTxId,
    ts: nowSeconds()
  });
  appendAgentKitAudit(caseDoc, {
    ...agentKit,
    label: "Verdict published to the HCS public docket",
    service: "HCS",
    txId,
    occurredAt: new Date()
  });
  return txId;
}

async function submitDocketMessage(message: Record<string, unknown>) {
  const agentKit = await touchAgentKit(`hcs:${message.type ?? "message"}`);

  const topicId = process.env.HEDERA_DOCKET_TOPIC_ID;
  if (isMockHederaAllowed() || !topicId) {
    return {
      txId: `demo-hcs-${message.type}-${Date.now()}`,
      agentKit
    };
  }

  const client = getHederaClient();
  const response = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(JSON.stringify(message))
    .execute(client);
  await response.getReceipt(client);
  return {
    txId: response.transactionId.toString(),
    agentKit
  };
}
