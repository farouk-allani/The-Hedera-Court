import { CaseModel } from "@/lib/db/models/Case";
import { isMockHederaAllowed } from "@/lib/utils";

const MIRROR_NODE = "https://testnet.mirrornode.hedera.com";
const COURT_ANTE_TINYBARS = 50_000_000;
const MAX_PAYMENT_AGE_SECONDS = 60 * 60;

type VerifyPaymentInput = {
  txId: string;
  expectedSender: string;
};

type MirrorTransaction = {
  result: string;
  transaction_id: string;
  valid_start_timestamp: string;
  transfers?: Array<{
    account: string;
    amount: number;
  }>;
};

export async function verifyCourtAntePayment({
  txId,
  expectedSender
}: VerifyPaymentInput) {
  const mirrorTxId = toMirrorTransactionId(txId);
  const used = await CaseModel.findOne({
    $or: [
      { plaintiffPaymentTxId: { $in: [txId, mirrorTxId] } },
      { defendantPaymentTxId: { $in: [txId, mirrorTxId] } }
    ]
  });

  if (used) {
    throw new Error("This transaction has already been entered into evidence.");
  }

  if (isMockHederaAllowed() || txId.startsWith("demo-")) {
    return {
      txId: mirrorTxId,
      senderAccountId: expectedSender,
      mock: true
    };
  }

  const treasury = process.env.HEDERA_COURT_TREASURY_ID;
  if (!treasury) {
    throw new Error("HEDERA_COURT_TREASURY_ID is required");
  }
  if (expectedSender === treasury) {
    throw new Error("The court treasury cannot pay its own ante.");
  }

  const response = await fetch(
    `${MIRROR_NODE}/api/v1/transactions/${encodeURIComponent(mirrorTxId)}`,
    { cache: "no-store" }
  );
  if (!response.ok) {
    throw new Error("Mirror Node cannot find the ante payment yet.");
  }

  const payload = (await response.json()) as { transactions?: MirrorTransaction[] };
  const tx = payload.transactions?.find(
    (candidate) => candidate.transaction_id === mirrorTxId || candidate.transaction_id === txId
  ) ?? payload.transactions?.[0];

  if (!tx) {
    throw new Error("Mirror Node returned no matching transaction.");
  }

  if (tx.result !== "SUCCESS") {
    throw new Error("The ante transaction did not succeed.");
  }

  const age = Date.now() / 1000 - Number(tx.valid_start_timestamp.split(".")[0]);
  if (!Number.isFinite(age) || age > MAX_PAYMENT_AGE_SECONDS) {
    throw new Error("The ante transaction is too old for this filing.");
  }

  const senderDebit = tx.transfers?.find(
    (transfer) =>
      transfer.account === expectedSender && transfer.amount <= -COURT_ANTE_TINYBARS
  );
  const treasuryCredit = tx.transfers?.find(
    (transfer) =>
      transfer.account === treasury && transfer.amount >= COURT_ANTE_TINYBARS
  );

  if (!senderDebit) {
    throw new Error("The ante was not paid by the connected wallet.");
  }
  if (!treasuryCredit) {
    throw new Error("The ante was not paid to the court treasury.");
  }

  return {
    txId: tx.transaction_id,
    senderAccountId: senderDebit.account,
    mock: false
  };
}

function toMirrorTransactionId(txId: string) {
  if (!txId.includes("@")) {
    return txId;
  }
  const [account, timestamp] = txId.split("@");
  const [seconds, nanos = "0"] = timestamp.split(".");
  return `${account}-${seconds}-${nanos.padEnd(9, "0")}`;
}
