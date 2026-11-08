import {
  TransactionReceiptNotFoundError,
  WaitForTransactionReceiptTimeoutError,
  type Address,
  type Hash,
  type PublicClient,
} from 'viem';

import type { NetworkId, TokenSymbol } from './networks';

export type LocalTxStatus = 'pending' | 'confirmed' | 'failed';

/** A transfer sent from this device. Amounts are stored as decimal strings of base units. */
export type LocalTx = {
  hash: Hash;
  networkId: NetworkId;
  from: Address;
  to: Address;
  token: TokenSymbol;
  amount: string;
  createdAt: number;
  status: LocalTxStatus;
  /** Set when a speed-up/cancel from another wallet replaced our transaction. */
  replacedBy?: Hash;
  settledAt?: number;
};

export type TrackResult =
  { status: 'confirmed' | 'failed'; replacedBy?: Hash } | { status: 'pending' };

/**
 * Waits for the receipt (spec §8: waitForTransactionReceipt). Handles replacement
 * (speed-up/cancel): a replaced transaction follows its replacement's receipt.
 * Times out back to 'pending' so the caller can retry later (e.g. after a restart).
 */
export async function trackTransaction(
  client: PublicClient,
  hash: Hash,
  { timeoutMs = 5 * 60_000, pollingInterval = 4_000 } = {},
): Promise<TrackResult> {
  let replacedBy: Hash | undefined;
  try {
    const receipt = await client.waitForTransactionReceipt({
      hash,
      timeout: timeoutMs,
      pollingInterval,
      onReplaced: (r) => {
        if (r.reason !== 'repriced') replacedBy = r.transaction.hash;
      },
    });
    const status = receipt.status === 'success' ? 'confirmed' : 'failed';
    return replacedBy ? { status, replacedBy } : { status };
  } catch (error) {
    if (
      error instanceof WaitForTransactionReceiptTimeoutError ||
      error instanceof TransactionReceiptNotFoundError
    ) {
      return { status: 'pending' };
    }
    throw error;
  }
}
