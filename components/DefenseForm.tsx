"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Feather, ScrollText, Sparkles } from "lucide-react";
import { useState } from "react";
import { useWallet } from "@/components/WalletProvider";
import type { PublicCase } from "@/lib/cases/types";

type PendingPayment = {
  txId: string;
  payerAccountId: string;
};

type DefenseFormProps = {
  caseData: PublicCase;
  onCaseUpdated: (caseData: PublicCase) => void;
};

export function DefenseForm({ caseData, onCaseUpdated }: DefenseFormProps) {
  const { accountId, payAnte } = useWallet();
  const [defense, setDefense] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);

  async function plead() {
    setBusy(true);
    setError("");
    try {
      if (!accountId) {
        throw new Error("Connect HashPack before pleading.");
      }
      if (accountId === caseData.plaintiffAccountId) {
        throw new Error("The plaintiff may not wear a fake moustache and plead as the defendant.");
      }
      const payment = pendingPayment ?? (await payAnte(caseData.courtTreasuryId));
      setPendingPayment(payment);
      const response = await fetch(`/api/cases/${caseData.caseId}/defend`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          defendantId: payment.payerAccountId,
          defense,
          paymentTxId: payment.txId
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "The court refused the defense.");
      }
      setPendingPayment(null);
      onCaseUpdated(payload as PublicCase);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The court is in recess. Try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="court-panel overflow-hidden bg-cream">
      <div className="relative h-32 border-b border-brass/70">
        <Image
          src="/generated/evidence-collage.png"
          alt="Court papers awaiting a defense"
          fill
          sizes="(max-width: 768px) 100vw, 520px"
          className="object-cover object-[18%_58%]"
        />
        <div className="absolute inset-0 bg-[rgba(244,236,216,0.30)]" />
        <motion.div
          className="absolute bottom-4 left-4 border border-brass bg-cream px-3 py-2 small-caps text-sm text-brass shadow-paper"
          animate={{ rotate: [-2, 2, -2], y: [0, -3, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          Clerk is watching
        </motion.div>
      </div>

      <div className="relative p-5 md:p-7">
        <motion.div
          className="pointer-events-none absolute -right-5 top-5 h-16 w-20 border border-oxblood/45 bg-cream/70"
          animate={{ rotate: [8, 3, 8], y: [0, 5, 0] }}
          transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="small-caps text-brass">Defense lectern</p>
            <h2 className="mt-2 font-display text-4xl">Plead your defense</h2>
          </div>
          <ScrollText className="text-brass" size={34} aria-hidden="true" />
        </div>

        <textarea
          value={defense}
          onChange={(event) => setDefense(event.target.value.slice(0, 280))}
          placeholder="It ships faster."
          className="mt-5 min-h-40 w-full resize-none border border-brass bg-cream/85 p-4 text-2xl leading-8 text-ink shadow-[inset_0_0_18px_rgba(138,109,59,0.10)] placeholder:text-ink/45"
        />
        <div className="mt-2 flex justify-between text-sm text-ink/70">
          <span>Symbolic testnet ante: 0.5 ℏ</span>
          <span>{defense.length}/280</span>
        </div>
        <button
          type="button"
          onClick={plead}
          disabled={busy || defense.trim().length < 2}
          className="group mt-6 inline-flex w-full items-center justify-center gap-2 border border-oxblood bg-oxblood px-4 py-3 small-caps text-base text-cream shadow-stamp transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {busy ? (
            <Sparkles size={18} className="animate-pulse" aria-hidden="true" />
          ) : (
            <Feather
              size={18}
              className="transition-transform group-hover:-rotate-6"
              aria-hidden="true"
            />
          )}
          {busy
            ? "Justice Magpie is reading the briefs..."
            : pendingPayment
              ? "Retry signed plea"
              : "Pay your ante (0.5 ℏ)"}
        </button>
        {error ? (
          <p className="mt-4 border border-oxblood/60 bg-cream p-3 text-lg text-oxblood">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
