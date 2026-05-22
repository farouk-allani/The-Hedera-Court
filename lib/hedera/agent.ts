import { allCorePlugins } from "@hashgraph/hedera-agent-kit/plugins";
import { AgentMode } from "@hashgraph/hedera-agent-kit";
import { HederaLangchainToolkit } from "@hashgraph/hedera-agent-kit-langchain";
import { getHederaClient } from "@/lib/hedera/client";
import { isMockHederaAllowed } from "@/lib/utils";

let toolkitPromise: Promise<unknown> | null = null;

export type AgentKitTouch = {
  action: string;
  autonomous: boolean;
  toolCount: number;
};

export type AgentKitAuditEntry = AgentKitTouch & {
  label: string;
  service: "HCS" | "HTS" | "HBAR";
  txId?: string;
  occurredAt: Date;
};

export async function getHederaAgentToolkit() {
  if (isMockHederaAllowed()) {
    return null;
  }

  toolkitPromise ??= Promise.resolve(
    new HederaLangchainToolkit({
      client: getHederaClient(),
      configuration: {
        plugins: allCorePlugins,
        context: {
          mode: AgentMode.AUTONOMOUS
        }
      }
    })
  );

  return toolkitPromise;
}

export async function touchAgentKit(action: string): Promise<AgentKitTouch> {
  try {
    const toolkit = (await getHederaAgentToolkit()) as
      | { getTools?: () => unknown[] }
      | null;
    const tools = toolkit?.getTools?.() ?? [];
    return {
      action,
      autonomous: true,
      toolCount: tools.length
    };
  } catch {
    return {
      action,
      autonomous: true,
      toolCount: 0
    };
  }
}

export function appendAgentKitAudit(
  caseDoc: {
    agentKitActions?: unknown[];
  },
  entry: AgentKitAuditEntry
) {
  caseDoc.agentKitActions = [...(caseDoc.agentKitActions ?? []), entry];
}
