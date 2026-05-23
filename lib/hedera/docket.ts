import type { HydratedDocument } from "mongoose";
import { TopicMessageSubmitTransaction } from "@hiero-ledger/sdk";
import type { ICase } from "@/lib/db/models/Case";
import { getHederaClient } from "@/lib/hedera/client";
import { appendAgentKitAudit, runAgentTool, touchAgentKit } from "@/lib/hedera/agent";
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
  const action = `hcs:${message.type ?? "message"}`;
  const topicId = process.env.HEDERA_DOCKET_TOPIC_ID;

  if (isMockHederaAllowed() || !topicId) {
    return {
      txId: `demo-hcs-${message.type}-${Date.now()}`,
      agentKit: await touchAgentKit(action)
    };
  }

  const serialized = JSON.stringify(message);

  // Primary path: the autonomous court clerk writes to the public docket through the
  // Hedera Agent Kit's submit_topic_message_tool and returns the real transaction id.
  try {
    const result = await runAgentTool(action, "submit_topic_message_tool", {
      topicId,
      message: serialized,
      transactionMemo: `The Hedera Court ${message.type ?? "message"}`
    });
    return { txId: result.txId as string, agentKit: result.touch };
  } catch (err) {
    console.warn(`Agent Kit HCS submit failed for ${action}; falling back to SDK.`, err);
  }

  // Fallback: deterministic SDK submit so a slow or unavailable kit never stalls a demo.
  const client = getHederaClient();
  const response = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(serialized)
    .execute(client);
  await response.getReceipt(client);
  return {
    txId: response.transactionId.toString(),
    agentKit: await touchAgentKit(action)
  };
}
