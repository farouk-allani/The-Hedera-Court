"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AgentKitAudit } from "@/components/AgentKitAudit";
import { BrassPlaque } from "@/components/BrassPlaque";
import { InkStamp } from "@/components/InkStamp";
import { VerdictNFTCard } from "@/components/VerdictNFTCard";
import type { PublicCase } from "@/lib/cases/types";

export function VerdictReveal({ caseData }: { caseData: PublicCase }) {
  const verdictText = useMemo(() => {
    const ruling = caseData.verdict?.ruling ?? "";
    const sentence = caseData.verdict?.sentence ?? "";
    return `${ruling}\n\nSentence: ${sentence}\n\nCourt is adjourned. Try to be less.`;
  }, [caseData.verdict?.ruling, caseData.verdict?.sentence]);

  const [typed, setTyped] = useState("");

  useEffect(() => {
    setTyped("");
    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      setTyped(verdictText.slice(0, index));
      if (index >= verdictText.length) {
        clearInterval(timer);
      }
    }, 34);
    return () => clearInterval(timer);
  }, [verdictText]);

  const stampLabel =
    caseData.verdict?.winner === "plaintiff" ? "PLAINTIFF" : "DEFENDANT";

  return (
    <div className="court-panel overflow-hidden bg-cream/95">
      <div className="relative overflow-hidden border-b border-brass/70 p-5 md:p-7">
        <Image
          src="/generated/verdict-cards-bg.jpg"
          alt="Verdict cards on a court desk"
          fill
          quality={76}
          sizes="(max-width: 768px) 100vw, 720px"
          className="object-cover object-center opacity-70"
        />
        <div className="absolute inset-0 bg-cream/55" />
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-shadow/55 via-shadow/20 to-transparent" />

        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26 }}
        >
          <BrassPlaque>Case No. {caseData.caseNumber}</BrassPlaque>
          <h2 className="mt-5 max-w-3xl break-words font-display text-4xl leading-tight text-cream drop-shadow-[0_2px_0_rgba(14,10,8,0.75)] md:text-5xl">
            {caseData.verdict?.caseName}
          </h2>
        </motion.div>

        <motion.pre
          className="relative z-10 mt-6 max-h-[34rem] min-h-72 overflow-y-auto whitespace-pre-wrap break-words border border-brass bg-cream p-5 font-verdict text-[0.95rem] leading-7 text-ink shadow-paper [overflow-wrap:anywhere] md:text-base"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.1 }}
        >
          {typed}
        </motion.pre>

        <motion.div
          className="relative z-20 mt-5 flex min-h-28 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <InkStamp
            label={`${stampLabel} WINS`}
            tone={caseData.verdict?.winner === "plaintiff" ? "acquitted" : "filed"}
            className="h-28 w-full max-w-72"
          />
        </motion.div>
      </div>

      <motion.div
        className="grid gap-5 p-5 sm:grid-cols-2 md:p-7"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: 0.14,
              delayChildren: 0.18
            }
          }
        }}
      >
        {(["plaintiff", "defendant"] as const).map((side, index) => (
          <motion.div
            key={side}
            variants={{
              hidden: { opacity: 0, y: 38, rotate: index === 0 ? -3 : 3 },
              show: { opacity: 1, y: 0, rotate: 0 }
            }}
            transition={{ duration: 0.34, ease: "easeOut" }}
          >
            <VerdictNFTCard caseData={caseData} side={side} />
          </motion.div>
        ))}
      </motion.div>

      <AgentKitAudit caseData={caseData} />

      <div className="border-t border-brass/60 p-5 md:p-7">
        <p className="small-caps text-brass">HashScan receipts</p>
        <div className="mt-3 grid gap-2 font-verdict text-sm">
          {Object.entries(caseData.hashscan).map(([label, href]) =>
            href ? (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-oxblood underline"
              >
                {label}
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}
