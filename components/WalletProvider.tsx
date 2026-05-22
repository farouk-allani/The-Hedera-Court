"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState
} from "react";
import type { ReactNode } from "react";

type WalletState = {
  accountId: string;
  connecting: boolean;
  error: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  setDemoAccount: (accountId: string) => void;
  payAnte: (treasuryId: string) => Promise<WalletPayment>;
};

const WalletContext = createContext<WalletState | null>(null);

type WalletPayment = {
  txId: string;
  payerAccountId: string;
};

type HashConnectInstance = {
  init: () => Promise<unknown>;
  openPairingModal: (
    themeMode?: "dark" | "light",
    backgroundColor?: string,
    accentColor?: string,
    accentFillColor?: string,
    borderRadius?: string
  ) => Promise<void> | void;
  disconnect: () => void;
  getSigner: (accountId: unknown) => unknown;
  pairingEvent: { on: (handler: (data: { accountIds?: string[] }) => void) => void };
  disconnectionEvent: { on: (handler: () => void) => void };
  connectionStatusChangeEvent: { on: (handler: (state: string) => void) => void };
};

export function WalletProvider({ children }: { children: ReactNode }) {
  const [accountId, setAccountId] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const hashconnectRef = useRef<HashConnectInstance | null>(null);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError("");

    try {
      const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
      if (!projectId) {
        throw new Error(
          "Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID to connect HashPack."
        );
      }

      const [{ HashConnect }, { LedgerId }] = await Promise.all([
        import("hashconnect"),
        import("@hashgraph/sdk")
      ]);

      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (typeof window !== "undefined" ? window.location.origin : "");

      const hashconnect = new HashConnect(
        LedgerId.TESTNET,
        projectId,
        {
          name: "The Hedera Court",
          description: "Petty disputes. Serious receipts.",
          icons: [`${appUrl}/stamp-filed.svg`],
          url: appUrl
        },
        false
      ) as HashConnectInstance;

      hashconnect.pairingEvent.on((pairing) => {
        const pairedAccount = pairing.accountIds?.at(-1);
        if (pairedAccount) {
          setAccountId(pairedAccount);
        }
      });

      hashconnect.disconnectionEvent.on(() => {
        setAccountId("");
      });

      hashconnect.connectionStatusChangeEvent.on((state) => {
        if (state === "Disconnected") {
          setAccountId("");
        }
      });

      await hashconnect.init();
      hashconnectRef.current = hashconnect;
      await hashconnect.openPairingModal(
        "light",
        "#f4ecd8",
        "#6b1c1c",
        "#8a6d3b",
        "4px"
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "HashPack declined the summons.");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    hashconnectRef.current?.disconnect();
    hashconnectRef.current = null;
    setAccountId("");
  }, []);

  const setDemoAccount = useCallback((value: string) => {
    setAccountId(value.trim());
    setError("");
  }, []);

  const payAnte = useCallback(
    async (treasuryId: string) => {
      if (!accountId) {
        throw new Error("Connect HashPack before approaching the bench.");
      }

      if (!treasuryId) {
        return {
          txId: `demo-${accountId}-${Date.now()}`,
          payerAccountId: accountId
        };
      }

      if (accountId === treasuryId) {
        throw new Error("Use a wallet different from the court treasury for this plea.");
      }

      const hashconnect = hashconnectRef.current;
      if (!hashconnect) {
        if (process.env.NODE_ENV !== "production") {
          return {
            txId: `demo-${accountId}-${Date.now()}`,
            payerAccountId: accountId
          };
        }
        throw new Error("HashPack is not connected.");
      }

      const { AccountId, Hbar, TransferTransaction } = await import("@hashgraph/sdk");
      const fromAccount = AccountId.fromString(accountId);
      const signer = hashconnect.getSigner(fromAccount) as any;

      const transaction = await new TransferTransaction()
        .addHbarTransfer(fromAccount, Hbar.fromTinybars(-50_000_000))
        .addHbarTransfer(treasuryId, Hbar.fromTinybars(50_000_000))
        .setTransactionMemo("The Hedera Court ante")
        .freezeWithSigner(signer);

      const response = (await transaction.executeWithSigner(signer)) as {
        transactionId?: { toString: () => string };
        getReceiptWithSigner?: (signer: unknown) => Promise<unknown>;
      };

      if (response.getReceiptWithSigner) {
        await response.getReceiptWithSigner(signer);
      }

      const txId = response.transactionId?.toString();
      if (!txId) {
        throw new Error("HashPack returned no transaction id.");
      }
      const payerAccountId = getPayerAccountId(txId);
      setAccountId(payerAccountId);

      return {
        txId,
        payerAccountId
      };
    },
    [accountId]
  );

  const value = useMemo(
    () => ({
      accountId,
      connecting,
      error,
      connect,
      disconnect,
      setDemoAccount,
      payAnte
    }),
    [accountId, connecting, error, connect, disconnect, setDemoAccount, payAnte]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

function getPayerAccountId(txId: string) {
  const [payerAccountId] = txId.split("@");
  if (!/^0\.0\.\d+$/.test(payerAccountId)) {
    throw new Error("HashPack returned a malformed transaction id.");
  }
  return payerAccountId;
}

export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return value;
}
