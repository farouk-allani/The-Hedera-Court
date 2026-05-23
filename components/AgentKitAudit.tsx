import { Bot, CircuitBoard, ExternalLink } from "lucide-react";
import type { PublicCase } from "@/lib/cases/types";

export function AgentKitAudit({ caseData }: { caseData: PublicCase }) {
  const actions = caseData.agentKit.actions;
  const maxToolCount = actions.reduce(
    (count, action) => Math.max(count, action.toolCount),
    0
  );

  return (
    <section className="border-t border-brass/60 p-5 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="small-caps text-brass">Hedera Agent Kit trace</p>
          <h3 className="mt-1 font-display text-3xl leading-none text-ink">
            Autonomous court clerk
          </h3>
        </div>
        <div className="flex flex-wrap gap-2 font-verdict text-xs">
          <span className="inline-flex h-8 items-center gap-2 border border-brass bg-cream px-3 text-oxblood">
            <Bot size={14} aria-hidden="true" />
            {caseData.agentKit.mode}
          </span>
          <span className="inline-flex h-8 items-center gap-2 border border-brass bg-cream px-3 text-ink/80">
            <CircuitBoard size={14} aria-hidden="true" />
            {maxToolCount} tools
          </span>
          <span className="inline-flex h-8 items-center border border-brass bg-cream px-3 text-ink/80">
            {caseData.agentKit.pluginSet}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {actions.length > 0 ? (
          actions.map((action, index) => (
            <div
              key={`${action.action}-${action.txId ?? index}`}
              className="grid gap-3 border border-brass/60 bg-cream/75 p-3 text-sm md:grid-cols-[5rem_1fr_auto]"
            >
              <span className="inline-flex h-7 w-16 items-center justify-center border border-brass/70 font-verdict text-xs text-oxblood">
                {action.service}
              </span>
              <div>
                <p className="font-verdict text-ink">
                  {action.label}
                  {action.executed ? (
                    <span className="ml-2 inline-flex h-5 items-center border border-moss/70 px-1.5 align-middle small-caps text-[10px] text-moss">
                      executed
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 font-verdict text-xs text-ink/65">
                  {action.executed && action.toolName
                    ? `${action.toolName} / executed by Agent Kit / ${action.toolCount} tools loaded`
                    : `${action.action} / ${action.toolCount} Agent Kit tools / ${
                        action.autonomous ? "autonomous" : "manual"
                      }`}
                </p>
              </div>
              {action.hashscanUrl ? (
                <a
                  href={action.hashscanUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 self-center small-caps text-xs text-oxblood underline"
                >
                  HashScan
                  <ExternalLink size={13} aria-hidden="true" />
                </a>
              ) : null}
            </div>
          ))
        ) : (
          <div className="border border-brass/60 bg-cream/75 p-3 font-verdict text-sm text-ink/70">
            Awaiting autonomous Hedera actions.
          </div>
        )}
      </div>
    </section>
  );
}
