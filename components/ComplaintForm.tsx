"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Copy, Feather, ReceiptText, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { InkStamp } from "@/components/InkStamp";
import { useWallet } from "@/components/WalletProvider";
import type { PublicCase } from "@/lib/cases/types";

type PendingPayment = {
  txId: string;
  payerAccountId: string;
};

export function ComplaintForm({ treasuryId }: { treasuryId: string }) {
  const { accountId, payAnte } = useWallet();
  const [complaint, setComplaint] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filedCase, setFiledCase] = useState<PublicCase | null>(null);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);

  const shareUrl = useMemo(() => {
    if (!filedCase || typeof window === "undefined") {
      return "";
    }
    return `${window.location.origin}/case/${filedCase.caseId}`;
  }, [filedCase]);

  async function fileComplaint() {
    setBusy(true);
    setError("");
    try {
      if (!accountId) {
        throw new Error("Connect HashPack before filing.");
      }
      const payment = pendingPayment ?? (await payAnte(treasuryId));
      setPendingPayment(payment);
      const response = await fetch("/api/cases/file", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          plaintiffId: payment.payerAccountId,
          complaint,
          paymentTxId: payment.txId
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "The clerk rejected the filing.");
      }
      setPendingPayment(null);
      setFiledCase(payload as PublicCase);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The court is in recess. Try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="court-panel relative overflow-hidden bg-cream/95">
      <div className="relative h-36 border-b border-brass/70">
        <Image
          src="/generated/evidence-collage.png"
          alt="Court evidence desk"
          fill
          sizes="(max-width: 768px) 100vw, 520px"
          className="object-cover object-[55%_62%]"
        />
        <div className="absolute inset-0 bg-[rgba(244,236,216,0.28)]" />
        <motion.div
          className="absolute bottom-4 right-4 border border-oxblood bg-cream/90 px-3 py-2 small-caps text-sm text-oxblood shadow-paper"
          initial={{ opacity: 0, rotate: -8, scale: 1.2 }}
          animate={{ opacity: 1, rotate: -2, scale: 1 }}
          transition={{ duration: 0.22, delay: 0.2 }}
        >
          Ante: 0.5 ℏ
        </motion.div>
      </div>

      <div className="relative p-5 md:p-7">
        <motion.div
          className="pointer-events-none absolute -right-8 top-7 h-24 w-24 border border-brass/50 bg-cream/70"
          animate={{ rotate: [5, 9, 5], y: [0, -4, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="small-caps text-brass">Plaintiff filing desk</p>
            <h2 className="mt-1 font-display text-4xl">File a complaint</h2>
          </div>
          <ReceiptText className="text-brass" size={34} aria-hidden="true" />
        </div>

        <label htmlFor="complaint" className="small-caps text-sm text-oxblood">
          Complaint, maximum 280 characters
        </label>
        <textarea
          id="complaint"
          value={complaint}
          onChange={(event) => setComplaint(event.target.value.slice(0, 280))}
          placeholder="My friend says `any` in TypeScript is fine."
          className="mt-2 min-h-40 w-full resize-none border border-brass bg-cream/85 p-4 text-2xl leading-8 text-ink shadow-[inset_0_0_18px_rgba(138,109,59,0.10)] placeholder:text-ink/45"
        />
        <div className="mt-2 flex justify-between text-sm text-ink/70">
          <span>Symbolic testnet ante: 0.5 ℏ</span>
          <span>{complaint.length}/280</span>
        </div>

        <button
          type="button"
          onClick={fileComplaint}
          disabled={busy || complaint.trim().length < 3}
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
            ? "Entering evidence..."
            : pendingPayment
              ? "Retry signed filing"
              : "File a complaint"}
        </button>

        {error ? (
          <p className="mt-4 border border-oxblood/60 bg-cream p-3 text-lg text-oxblood">
            {error}
          </p>
        ) : null}

        {filedCase ? (
          <motion.div
            className="mt-7 border-t border-brass/60 pt-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
          >
            <InkStamp label="CASE FILED" className="mx-auto h-28 w-64 -rotate-2" />
            <p className="mt-5 small-caps text-brass">Summon the defendant.</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                readOnly
                value={shareUrl}
                className="min-w-0 flex-1 border border-brass bg-cream px-3 py-2 font-verdict text-sm"
              />
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="inline-flex items-center justify-center gap-2 border border-brass px-3 py-2 small-caps text-sm text-oxblood transition-colors hover:bg-brass hover:text-cream"
              >
                <Copy size={16} aria-hidden="true" />
                Copy
              </button>
            </div>
            <Link
              href={`/case/${filedCase.caseId}`}
              className="mt-4 inline-block small-caps text-sm text-oxblood underline"
            >
              Open case
            </Link>
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}
