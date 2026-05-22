import { Client, PrivateKey } from "@hiero-ledger/sdk";
import { requireEnv } from "@/lib/utils";

export function parseHederaPrivateKey(value: string) {
  const trimmed = value.trim();
  const parsers = [
    () => PrivateKey.fromStringECDSA(trimmed),
    () => PrivateKey.fromStringED25519(trimmed),
    () => PrivateKey.fromString(trimmed)
  ];

  for (const parser of parsers) {
    try {
      return parser();
    } catch {
      // Try the next supported key encoding.
    }
  }

  throw new Error("HEDERA_OPERATOR_KEY is not a valid Hedera private key");
}

export function getHederaClient() {
  const network = process.env.HEDERA_NETWORK || "testnet";
  if (network !== "testnet") {
    throw new Error("The Hedera Court is testnet-only.");
  }

  const client = Client.forTestnet();
  client.setOperator(
    requireEnv("HEDERA_OPERATOR_ID"),
    parseHederaPrivateKey(requireEnv("HEDERA_OPERATOR_KEY"))
  );
  return client;
}

export function getOperatorKey() {
  return parseHederaPrivateKey(requireEnv("HEDERA_OPERATOR_KEY"));
}
