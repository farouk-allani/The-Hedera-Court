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
  /** True only when the on-chain action was genuinely executed by an Agent Kit tool. */
  executed: boolean;
  /** The Agent Kit tool that executed the action, e.g. "submit_topic_message_tool". */
  toolName?: string;
};

export type AgentKitAuditEntry = AgentKitTouch & {
  label: string;
  service: "HCS" | "HTS" | "HBAR";
  txId?: string;
  occurredAt: Date;
};

type AgentKitTool = {
  name: string;
  invoke: (args: Record<string, unknown>) => Promise<unknown>;
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

async function getAgentTools(): Promise<AgentKitTool[]> {
  const toolkit = (await getHederaAgentToolkit()) as
    | { getTools?: () => unknown[] }
    | null;
  return (toolkit?.getTools?.() ?? []) as AgentKitTool[];
}

/**
 * Initializes the Agent Kit tool surface and records that it is available, without
 * executing a transaction. Used for the mock path and SDK fallbacks.
 */
export async function touchAgentKit(action: string): Promise<AgentKitTouch> {
  try {
    const tools = await getAgentTools();
    return {
      action,
      autonomous: true,
      executed: false,
      toolCount: tools.length
    };
  } catch {
    return {
      action,
      autonomous: true,
      executed: false,
      toolCount: 0
    };
  }
}

export type AgentToolResult = {
  txId?: string;
  status?: string;
  topicId?: string;
  tokenId?: string;
  touch: AgentKitTouch;
};

/**
 * Genuinely executes a Hedera action through the Hedera Agent Kit tool surface.
 *
 * The toolkit runs in AgentMode.AUTONOMOUS, so the named tool builds, signs, and
 * submits the transaction with the server-side court operator key, then returns the
 * real transaction id. This is the load-bearing Agent Kit path for the court's own
 * autonomous actions (HCS docket messages and the winner HBAR payout). User wallet
 * transfers are never routed here — players always sign their own antes in HashPack.
 */
export async function runAgentTool(
  action: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<AgentToolResult> {
  const tools = await getAgentTools();
  const tool = tools.find((candidate) => candidate.name === toolName);
  if (!tool) {
    throw new Error(`Hedera Agent Kit tool not available: ${toolName}`);
  }

  const output = await tool.invoke(args);
  const parsed = parseAgentToolOutput(output);

  if (!parsed.txId) {
    throw new Error(
      `Hedera Agent Kit tool ${toolName} returned no transaction id` +
        (parsed.status ? ` (status ${parsed.status})` : "")
    );
  }

  return {
    ...parsed,
    touch: {
      action,
      autonomous: true,
      executed: true,
      toolName,
      toolCount: tools.length
    }
  };
}

function parseAgentToolOutput(output: unknown): Omit<AgentToolResult, "touch"> {
  const root =
    typeof output === "string"
      ? safeJsonParse(output)
      : (output as Record<string, unknown> | undefined);

  const nestedRaw =
    root && typeof root === "object" && "raw" in root
      ? ((root as { raw?: unknown }).raw as Record<string, unknown> | undefined)
      : undefined;

  const source = nestedRaw ?? root ?? {};

  const txId =
    typeof source.transactionId === "string" && source.transactionId.length > 0
      ? source.transactionId
      : undefined;

  return {
    txId,
    status: typeof source.status === "string" ? source.status : undefined,
    topicId: stringifyId(source.topicId),
    tokenId: stringifyId(source.tokenId)
  };
}

function stringifyId(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === "string") {
    return value.length > 0 ? value : undefined;
  }
  const text = String(value);
  return text.length > 0 ? text : undefined;
}

function safeJsonParse(value: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return undefined;
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
