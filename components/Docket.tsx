"use client";

import Link from "next/link";
import { Bot, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import type { PublicCase } from "@/lib/cases/types";

export function Docket() {
  const [cases, setCases] = useState<PublicCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/docket", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "The court is in recess. Try again shortly.");
        }
        setCases(payload.cases ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "The court is in recess. Try again shortly.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <p className="small-caps text-brass">Fetching docket...</p>;
  }

  if (error) {
    return <p className="court-panel p-5 text-xl text-oxblood">{error}</p>;
  }

  if (cases.length === 0) {
    return (
      <div className="court-panel p-8 text-center">
        <p className="font-display text-4xl text-oxblood">
          The docket is empty. File the first complaint.
        </p>
        <Link href="/" className="mt-4 inline-block small-caps text-oxblood underline">
          File a complaint
        </Link>
      </div>
    );
  }

  return (
    <div className="docket-lines grid gap-4">
      {cases.map((caseItem) => (
        <article key={caseItem.caseId} className="court-panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="small-caps text-brass">Case No. {caseItem.caseNumber}</p>
              <h2 className="mt-1 font-display text-3xl text-ink">
                {caseItem.verdict?.caseName ?? "Unnamed matter awaiting mischief"}
              </h2>
            </div>
            <span className="border border-brass px-3 py-1 small-caps text-sm text-oxblood">
              {caseItem.status.replace("_", " ")}
            </span>
          </div>
          <div className="mt-3 inline-flex items-center gap-2 border border-brass/70 bg-cream/70 px-3 py-1 font-verdict text-xs text-ink/75">
            <Bot size={14} aria-hidden="true" />
            Agent Kit: {caseItem.agentKit.actions.length} autonomous actions
          </div>
          <p className="mt-4 text-2xl leading-8">{caseItem.complaint}</p>
          {caseItem.verdict ? (
            <p className="mt-3 font-verdict text-sm leading-6">
              Winner: {caseItem.verdict.winner}.{" "}
              {caseItem.verdict.ruling.slice(0, 160)}
              {caseItem.verdict.ruling.length > 160 ? "..." : ""}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/case/${caseItem.caseId}`} className="small-caps text-oxblood underline">
              Open case
            </Link>
            {caseItem.hashscan.verdict ? (
              <a
                href={caseItem.hashscan.verdict}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 small-caps text-oxblood underline"
              >
                Verdict receipt
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
