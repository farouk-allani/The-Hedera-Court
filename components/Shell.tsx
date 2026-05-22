import Link from "next/link";
import type { ReactNode } from "react";
import { WalletConnectButton } from "@/components/WalletConnectButton";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-brass/60 bg-cream/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Link href="/" className="font-plaque text-xl tracking-[0.12em] text-oxblood">
            THE HEDERA COURT
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/docket"
              className="border border-brass px-3 py-2 small-caps text-sm hover:bg-brass hover:text-cream"
            >
              Docket
            </Link>
            <WalletConnectButton />
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
