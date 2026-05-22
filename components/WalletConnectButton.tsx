"use client";

import { Landmark, LogOut } from "lucide-react";
import { useState } from "react";
import { useWallet } from "@/components/WalletProvider";

export function WalletConnectButton() {
  const { accountId, connecting, connect, disconnect, error, setDemoAccount } =
    useWallet();
  const [manual, setManual] = useState("");
  const [showFallback, setShowFallback] = useState(false);

  if (accountId) {
    return (
      <button
        type="button"
        onClick={disconnect}
        className="inline-flex items-center gap-2 border border-oxblood bg-oxblood px-3 py-2 small-caps text-sm text-cream"
        title="Disconnect wallet"
      >
        <LogOut size={16} aria-hidden="true" />
        {accountId}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={async () => {
          await connect();
          setShowFallback(true);
        }}
        className="inline-flex items-center gap-2 border border-oxblood px-3 py-2 small-caps text-sm text-oxblood hover:bg-oxblood hover:text-cream"
        disabled={connecting}
        title="Connect HashPack"
      >
        <Landmark size={16} aria-hidden="true" />
        {connecting ? "Summoning..." : "Connect HashPack"}
      </button>
      {error && showFallback ? (
        <div className="absolute right-0 top-12 z-10 w-72 border border-brass bg-cream p-3 shadow-paper">
          <p className="text-sm leading-5 text-oxblood">{error}</p>
          <div className="mt-3 flex gap-2">
            <input
              value={manual}
              onChange={(event) => setManual(event.target.value)}
              placeholder="0.0.12345"
              className="min-w-0 flex-1 border border-brass bg-cream px-2 py-1 text-base"
            />
            <button
              type="button"
              onClick={() => setDemoAccount(manual)}
              className="border border-oxblood px-2 py-1 small-caps text-xs text-oxblood"
            >
              Clerk
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
