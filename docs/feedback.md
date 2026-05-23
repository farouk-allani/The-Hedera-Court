# Hedera Agent Kit Feedback

This is the feedback submitted for the Hedera AI Agent Bounty (Week 1: Fun Basic Hedera Agent),
written while building **The Hedera Court** on `@hashgraph/hedera-agent-kit@4.0.0` and
`@hashgraph/hedera-agent-kit-langchain@1.0.0`.

Post it as a GitHub issue on the Agent Kit repo: https://github.com/hashgraph/hedera-agent-kit-js/issues/847

---

## Title

`mint_non_fungible_token_tool` should return the minted NFT serial number(s) in its structured response

## Type

Feature request / developer-experience gap (JS Agent Kit v4).

## What happened

In `AgentMode.AUTONOMOUS`, `mint_non_fungible_token_tool` successfully mints an NFT, and the
tool's structured `raw` response includes `status`, `transactionId`, `tokenId`, and `topicId`.
It does **not** include the newly minted **serial number(s)**.

The `ExecuteStrategy` builds its result from the receipt as:

```
{ status, accountId, tokenId, transactionId, topicId, scheduleId }
```

`TransactionReceipt.serials` is available on the receipt for a token mint, but it is dropped
before the tool result is returned.

## Why it matters

Any app that mints an NFT and then needs to reference that specific token has to know the
serial: to render the NFT, build HIP-412 metadata that points at it, transfer it, or store it.
Because the serial is not returned, we had to fall back to the raw `@hiero-ledger/sdk`
`TokenMintTransaction` (reading `receipt.serials[0]`) for the mint step, even though every other
on-chain action in our app runs through the Agent Kit.

In our project (a courtroom that issues "Acquitted" / "Sentenced" verdict NFTs) this was the one
action we could not move onto the kit, purely because of the missing serial.

## Suggested fix

Include `serials` in the mint tool's `raw` response, sourced from `receipt.serials`. Optionally
include it for the fungible-mint and any other tool whose receipt carries data the caller needs
(e.g. `newTotalSupply`).

```diff
  const rawTransactionResponse = {
    status: receipt.status.toString(),
    accountId: receipt.accountId,
    tokenId: receipt.tokenId,
+   serials: receipt.serials?.map((s) => s.toString()),
    transactionId: tx.transactionId?.toString() ?? "",
    topicId: receipt.topicId,
    scheduleId: receipt.scheduleId,
  };
```

## Environment

- `@hashgraph/hedera-agent-kit@4.0.0`
- `@hashgraph/hedera-agent-kit-langchain@1.0.0`
- `@hiero-ledger/sdk@2.84.0`
- Network: Hedera Testnet, `AgentMode.AUTONOMOUS`

---

## Secondary feedback (optional, can be a separate issue or discussion)

A complete human-in-the-loop reference app would help new builders a lot. The hard part is not
calling a single tool — it is designing a safe flow where the **user** explicitly signs their own
wallet transactions, while the **agent** performs only limited, auditable server-side actions
(HCS messages, a treasury HBAR payout). A small reference that wires wallet-signed user payments
+ autonomous agent actions + HashScan links together would make it much easier to build fun
commercial or social agents without accidentally creating unsafe autonomous fund movement.
