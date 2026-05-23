import type { CaseStatus, JusticeWinner } from "@/lib/db/models/Case";

export type PublicVerdict = {
  caseName: string;
  ruling: string;
  sentence: string;
  winner: JusticeWinner;
  loserCrime: string;
};

export type PublicAgentKitAction = {
  action: string;
  label: string;
  service: "HCS" | "HTS" | "HBAR";
  txId?: string;
  hashscanUrl?: string;
  autonomous: boolean;
  executed: boolean;
  toolName?: string;
  toolCount: number;
  occurredAt?: string;
};

export type PublicCase = {
  caseId: string;
  caseNumber: number;
  plaintiffAccountId: string;
  defendantAccountId?: string;
  complaint: string;
  defense?: string;
  status: CaseStatus;
  verdict?: PublicVerdict;
  plaintiffNftSerial?: number;
  defendantNftSerial?: number;
  payoutTxId?: string;
  hcsFiledTxId?: string;
  hcsDefenseTxId?: string;
  hcsVerdictTxId?: string;
  plaintiffNftMintTxId?: string;
  defendantNftMintTxId?: string;
  courtTreasuryId: string;
  verdictTokenId?: string;
  docketTopicId?: string;
  agentKit: {
    mode: "AUTONOMOUS";
    pluginSet: "allCorePlugins";
    actions: PublicAgentKitAction[];
  };
  hashscan: {
    caseFiled?: string;
    defenseFiled?: string;
    verdict?: string;
    payout?: string;
    plaintiffNftMint?: string;
    defendantNftMint?: string;
    token?: string;
    topic?: string;
  };
  createdAt?: string;
  ruledAt?: string;
};
