export function hashscanTransactionUrl(txId: string) {
  return `https://hashscan.io/testnet/transaction/${encodeURIComponent(txId)}`;
}

export function hashscanTopicUrl(topicId: string) {
  return `https://hashscan.io/testnet/topic/${encodeURIComponent(topicId)}`;
}

export function hashscanTokenUrl(tokenId: string) {
  return `https://hashscan.io/testnet/token/${encodeURIComponent(tokenId)}`;
}
