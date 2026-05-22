"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { DefenseForm } from "@/components/DefenseForm";
import { BrassPlaque } from "@/components/BrassPlaque";
import { VerdictReveal } from "@/components/VerdictReveal";
import type { PublicCase } from "@/lib/cases/types";

export default function CasePage({ params }: { params: { caseId: string } }) {
  const [caseData, setCaseData] = useState<PublicCase | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    let timer: ReturnType<typeof setInterval> | undefined;

    async function load() {
      try {
        const response = await fetch(`/api/cases/${params.caseId}`, {
          cache: "no-store"
        });
        if (!response.ok) {
          throw new Error("The court cannot find this matter.");
        }
        const data = (await response.json()) as PublicCase;
        if (!live) {
          return;
        }
        setCaseData(data);
        setError("");
      } catch (err) {
        if (live) {
          setError(err instanceof Error ? err.message : "The court is in recess. Try again shortly.");
        }
      } finally {
        if (live) {
          setLoading(false);
        }
      }
    }

    load();
    timer = setInterval(load, 2500);

    return () => {
      live = false;
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [params.caseId]);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <div className="court-panel relative min-h-72 overflow-hidden p-8">
          <Image
            src="/generated/evidence-collage.jpg"
            alt=""
            fill
            quality={76}
            sizes="100vw"
            className="object-cover opacity-25"
          />
          <div className="relative">
            <p className="small-caps text-brass">Calling the clerk...</p>
            <motion.div
              className="mt-8 h-24 w-40 border border-brass bg-cream/80 shadow-paper"
              animate={{ x: [0, 18, 0], rotate: [-2, 3, -2] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
      </main>
    );
  }

  if (error || !caseData) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <p className="court-panel p-6 text-2xl text-oxblood">
          {error || "The court is in recess. Try again shortly."}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 md:grid-cols-[0.9fr_1.1fr] md:px-8 md:py-12">
      <section className="court-panel docket-lines overflow-hidden">
        <div className="relative h-44 border-b border-brass/70">
          <Image
            src="/generated/evidence-collage.jpg"
            alt="Case papers"
            fill
            quality={76}
            sizes="(max-width: 768px) 100vw, 480px"
            className="object-cover object-left"
          />
          <div className="absolute inset-0 bg-[rgba(244,236,216,0.36)]" />
          <div className="absolute bottom-4 left-5">
            <BrassPlaque>Case No. {caseData.caseNumber}</BrassPlaque>
          </div>
        </div>
        <div className="p-5 md:p-7">
          <h1 className="font-display text-4xl leading-tight text-ink">
            You have been named in Case No. {caseData.caseNumber}. Plead.
          </h1>
          <div className="mt-8 border border-brass bg-cream/80 p-5">
            <p className="small-caps text-sm text-oxblood">Complaint</p>
            <p className="mt-3 text-3xl leading-9">{caseData.complaint}</p>
          </div>
          {caseData.defense ? (
            <div className="mt-5 border border-brass/70 bg-cream/70 p-5">
              <p className="small-caps text-sm text-oxblood">Defense</p>
              <p className="mt-3 text-2xl leading-8">{caseData.defense}</p>
            </div>
          ) : null}
        </div>
      </section>

      <section>
        {caseData.status === "awaiting_defense" ? (
          <DefenseForm caseData={caseData} onCaseUpdated={setCaseData} />
        ) : null}

        {caseData.status === "ruling" ? (
          <div className="court-panel relative flex min-h-[420px] items-center justify-center overflow-hidden p-8 text-center">
            <Image
              src="/magpie-portrait.jpg"
              alt=""
              fill
              quality={78}
              sizes="(max-width: 768px) 100vw, 620px"
              className="object-cover opacity-25"
            />
            <div className="relative">
              <motion.div
                className="mx-auto mb-6 h-28 w-28 border border-brass bg-cream/80 shadow-paper"
                animate={{ rotate: [-2, 2, -2], scale: [1, 1.03, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image
                  src="/magpie-portrait.jpg"
                  alt="Justice Magpie"
                  width={112}
                  height={112}
                  quality={78}
                  className="h-full w-full object-cover"
                />
              </motion.div>
              <p className="small-caps text-brass">In chambers</p>
              <p className="mt-4 font-display text-4xl text-oxblood">
                Justice Magpie is reading the briefs...
              </p>
            </div>
          </div>
        ) : null}

        {caseData.status === "ruled" ? <VerdictReveal caseData={caseData} /> : null}

        {caseData.status === "stuck" ? (
          <div className="court-panel p-8">
            <p className="font-display text-4xl text-oxblood">
              The court is in recess. Try again shortly.
            </p>
            <p className="mt-4 text-xl">
              The ruling pipeline stored its progress and can be resumed by the
              clerk with <code>npm run resolve-stuck {caseData.caseId}</code>.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
