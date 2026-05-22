import "dotenv/config";
import fs from "fs/promises";
import {
  TopicCreateTransaction,
  TokenCreateTransaction,
  TokenSupplyType,
  TokenType
} from "@hiero-ledger/sdk";
import { getHederaClient, getOperatorKey } from "../lib/hedera/client";
import { requireEnv } from "../lib/utils";

const client = getHederaClient();
const operatorId = requireEnv("HEDERA_OPERATOR_ID");
const operatorKey = getOperatorKey();

console.log("Creating The Hedera Court docket topic on testnet...");
const topicResponse = await new TopicCreateTransaction()
  .setTopicMemo("The Hedera Court Docket")
  .execute(client);
const topicReceipt = await topicResponse.getReceipt(client);
const topicId = topicReceipt.topicId?.toString();

if (!topicId) {
  throw new Error("Topic creation did not return a topic id.");
}

console.log("Creating Hedera Court Verdicts NFT collection on testnet...");
const tokenResponse = await new TokenCreateTransaction()
  .setTokenName("Hedera Court Verdicts")
  .setTokenSymbol("VRD")
  .setTokenType(TokenType.NonFungibleUnique)
  .setSupplyType(TokenSupplyType.Infinite)
  .setTreasuryAccountId(operatorId)
  .setSupplyKey(operatorKey)
  .setTokenMemo("The Hedera Court testnet verdict NFTs")
  .execute(client);
const tokenReceipt = await tokenResponse.getReceipt(client);
const tokenId = tokenReceipt.tokenId?.toString();

if (!tokenId) {
  throw new Error("Token creation did not return a token id.");
}

const output = `HEDERA_VERDICT_TOKEN_ID=${tokenId}
HEDERA_DOCKET_TOPIC_ID=${topicId}
`;

await fs.writeFile(".env.local.generated", output);

console.log(output);
console.log("Wrote .env.local.generated. Copy these values into .env.local when ready.");
