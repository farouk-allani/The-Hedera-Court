"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { BrassPlaque } from "@/components/BrassPlaque";
import { ComplaintForm } from "@/components/ComplaintForm";

export function CourtHero({ treasuryId }: { treasuryId: string }) {
  return (
    <section className="relative min-h-[calc(100vh-73px)] overflow-hidden border-b border-brass/70">
      <Image
        src="/generated/court-hero-illustration.png"
        alt="Justice Magpie presiding in an old English law library"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-[rgba(244,236,216,0.18)]" />
      <div className="absolute inset-y-0 left-0 w-[58%] bg-[rgba(244,236,216,0.64)]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-[rgba(14,10,8,0.22)]" />

      <motion.div
        className="pointer-events-none absolute right-[7%] top-[12%] z-30 hidden h-28 w-44 drop-shadow-[0_14px_18px_rgba(14,10,8,0.24)] md:block"
        animate={{ y: [0, -10, 0], rotate: [8, 14, 8] }}
        transition={{ duration: 5.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src="/generated/court-gavel.png"
          alt=""
          fill
          sizes="176px"
          className="object-contain object-center opacity-95"
        />
      </motion.div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-73px)] w-full max-w-7xl items-end gap-8 px-4 py-8 md:grid-cols-[0.9fr_0.72fr] md:px-8 md:py-10">
        <motion.div
          className="pb-4 md:pb-14"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.42, ease: "easeOut" }}
        >
          <BrassPlaque>Testnet Courtroom</BrassPlaque>
          <h1 className="mt-5 max-w-3xl font-display text-6xl leading-[0.86] text-ink md:text-8xl">
            THE HEDERA COURT
          </h1>
          <p className="mt-4 max-w-xl font-display text-4xl leading-none text-oxblood md:text-5xl">
            Petty disputes. Serious receipts.
          </p>
          <p className="mt-8 max-w-2xl text-2xl leading-8 md:text-[1.7rem] md:leading-9">
            File your complaint. Summon the defendant. Let Justice Magpie do
            what civilization has failed to do: produce a verdict.
          </p>
          <div className="mt-8 flex max-w-2xl items-center gap-4 border-l border-brass/80 pl-4">
            <Image
              src="/magpie-portrait.png"
              alt="Justice Magpie"
              width={96}
              height={96}
              className="h-24 w-24 border border-brass object-cover shadow-paper"
            />
            <p className="text-lg leading-6">
              On the bench: tired eyes, strict receipts, and no patience for
              arguments that begin with &quot;it ships faster.&quot;
            </p>
          </div>
        </motion.div>

        <motion.div
          className="pb-2 md:pb-8"
          initial={{ opacity: 0, y: 28, rotate: 1.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.48, delay: 0.08, ease: "easeOut" }}
        >
          <ComplaintForm treasuryId={treasuryId} />
        </motion.div>
      </div>
    </section>
  );
}
