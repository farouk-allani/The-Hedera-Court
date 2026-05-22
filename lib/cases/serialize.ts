import type { HydratedDocument } from "mongoose";
import type { ICase } from "@/lib/db/models/Case";
import type { PublicAgentKitAction, PublicCase } from "@/lib/cases/types";
import {
  hashscanTokenUrl,
  hashscanTopicUrl,
  hashscanTransactionUrl
} from "@/lib/hedera/hashscan";

export function serializeCase(caseDoc: HydratedDocument<ICase> | ICase): PublicCase {
  const raw = typeof (caseDoc as HydratedDocument<ICase>).toObject === "function"
    ? (caseDoc as HydratedDocument<ICase>).toObject()
    : caseDoc;
  const verdict =
    raw.verdict?.caseName &&
    raw.verdict.ruling &&
    raw.verdict.sentence &&
    raw.verdict.winner &&
    raw.verdict.loserCrime
      ? {
          caseName: raw.verdict.caseName,
          ruling: raw.verdict.ruling,
          sentence: raw.verdict.sentence,
          winner: raw.verdict.winner,
          loserCrime: raw.verdict.loserCrime
        }
      : undefined;
  const agentKitActions = serializeAgentKitActions(raw.agentKitActions ?? []);

  return {
    caseId: raw.caseId,
    caseNumber: raw.caseNumber,
    plaintiffAccountId: raw.plaintiffAccountId,
    defendantAccountId: raw.defendantAccountId ?? undefined,
    complaint: raw.complaint,
    defense: raw.defense ?? undefined,
    status: raw.status,
    verdict,
    plaintiffNftSerial: raw.plaintiffNftSerial ?? undefined,
    defendantNftSerial: raw.defendantNftSerial ?? undefined,
    payoutTxId: raw.payoutTxId ?? undefined,
    hcsFiledTxId: raw.hcsFiledTxId ?? undefined,
    hcsDefenseTxId: raw.hcsDefenseTxId ?? undefined,
    hcsVerdictTxId: raw.hcsVerdictTxId ?? undefined,
    plaintiffNftMintTxId: raw.plaintiffNftMintTxId ?? undefined,
    defendantNftMintTxId: raw.defendantNftMintTxId ?? undefined,
    courtTreasuryId: process.env.HEDERA_COURT_TREASURY_ID ?? "",
    verdictTokenId: process.env.HEDERA_VERDICT_TOKEN_ID,
    docketTopicId: process.env.HEDERA_DOCKET_TOPIC_ID,
    agentKit: {
      mode: "AUTONOMOUS",
      pluginSet: "allCorePlugins",
      actions: agentKitActions
    },
    hashscan: {
      caseFiled: raw.hcsFiledTxId ? hashscanTransactionUrl(raw.hcsFiledTxId) : undefined,
      defenseFiled: raw.hcsDefenseTxId
        ? hashscanTransactionUrl(raw.hcsDefenseTxId)
        : undefined,
      verdict: raw.hcsVerdictTxId ? hashscanTransactionUrl(raw.hcsVerdictTxId) : undefined,
      payout: raw.payoutTxId ? hashscanTransactionUrl(raw.payoutTxId) : undefined,
      plaintiffNftMint: raw.plaintiffNftMintTxId
        ? hashscanTransactionUrl(raw.plaintiffNftMintTxId)
        : undefined,
      defendantNftMint: raw.defendantNftMintTxId
        ? hashscanTransactionUrl(raw.defendantNftMintTxId)
        : undefined,
      token: process.env.HEDERA_VERDICT_TOKEN_ID
        ? hashscanTokenUrl(process.env.HEDERA_VERDICT_TOKEN_ID)
        : undefined,
      topic: process.env.HEDERA_DOCKET_TOPIC_ID
        ? hashscanTopicUrl(process.env.HEDERA_DOCKET_TOPIC_ID)
        : undefined
    },
    createdAt: raw.createdAt?.toISOString?.(),
    ruledAt: raw.ruledAt?.toISOString?.()
  };
}

function serializeAgentKitActions(actions: unknown[]): PublicAgentKitAction[] {
  return actions
    .map((action) => {
      const entry = action as {
        action?: unknown;
        label?: unknown;
        service?: unknown;
        txId?: unknown;
        autonomous?: unknown;
        toolCount?: unknown;
        occurredAt?: { toISOString?: () => string } | string;
      };
      let service: PublicAgentKitAction["service"] = "HCS";
      if (entry.service === "HTS") {
        service = "HTS";
      } else if (entry.service === "HBAR") {
        service = "HBAR";
      }
      const txId = typeof entry.txId === "string" ? entry.txId : undefined;

      return {
        action: String(entry.action ?? "hedera:unknown"),
        label: String(entry.label ?? "Hedera Agent Kit action"),
        service,
        txId,
        hashscanUrl: txId ? hashscanTransactionUrl(txId) : undefined,
        autonomous: entry.autonomous !== false,
        toolCount: Number(entry.toolCount ?? 0),
        occurredAt:
          typeof entry.occurredAt === "string"
            ? entry.occurredAt
            : entry.occurredAt?.toISOString?.()
      };
    })
    .filter((action) => action.action !== "hedera:unknown" || action.txId);
}
