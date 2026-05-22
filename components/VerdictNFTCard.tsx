import { ExternalLink } from "lucide-react";
import Image from "next/image";
import type { PublicCase } from "@/lib/cases/types";

type VerdictNFTCardProps = {
  caseData: PublicCase;
  side: "plaintiff" | "defendant";
};

export function VerdictNFTCard({ caseData, side }: VerdictNFTCardProps) {
  const won = caseData.verdict?.winner === side;
  const label = won ? "ACQUITTED" : "SENTENCED";
  const serial =
    side === "plaintiff" ? caseData.plaintiffNftSerial : caseData.defendantNftSerial;
  const holder = side === "plaintiff" ? "Plaintiff" : "Defendant";

  return (
    <article className="relative overflow-hidden border border-brass bg-cream p-4 shadow-paper transition-transform duration-200 hover:-translate-y-1">
      <Image
        src="/generated/verdict-cards-bg.png"
        alt=""
        fill
        sizes="320px"
        className="object-cover opacity-[0.14]"
      />
      <div className="relative">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-brass/60 pb-3">
          <p className="small-caps text-sm text-brass">{holder} NFT</p>
          <span className="shrink-0 font-verdict text-xs text-ink/70">
            Serial #{serial ?? "pending"}
          </span>
        </div>
        <div className="relative mt-4 aspect-[3/4] overflow-hidden border border-brass/70 bg-cream p-3 shadow-[inset_0_0_18px_rgba(138,109,59,0.15)]">
          <Image
            src={`/nft/${caseData.caseId}/${side}.svg`}
            alt={`${holder} verdict NFT`}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, 320px"
            className="object-contain p-3"
          />
        </div>
        <div className="mt-4 flex min-w-0 flex-wrap items-end justify-between gap-3">
          <h3 className="min-w-0 break-words font-display text-[clamp(2rem,7vw,2.65rem)] leading-none text-oxblood">
            {label}
          </h3>
          <a
            href={`/nft/${caseData.caseId}/${side}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-2 small-caps text-sm text-oxblood underline"
          >
            Metadata
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}
