import {
  decodeFunctionData,
  erc20Abi,
  isAddressEqual,
  type Address,
  type Hash,
  type Hex,
} from 'viem';

import type { Network, TokenSymbol } from './networks';
import type { LocalTx, LocalTxStatus } from './pendingTx';

export type TxDirection = 'in' | 'out';

/** One row of history: a single token movement relative to our address. */
export type HistoryItem = {
  /** `${hash}:${token}` — one transaction could in theory move both tokens. */
  id: string;
  hash: Hash;
  token: TokenSymbol;
  direction: TxDirection;
  /** The other side: recipient for outgoing, sender for incoming. */
  counterparty: Address;
  from: Address;
  to: Address;
  amount: bigint;
  /** ms since epoch: block time for indexed txs, send time for local ones. */
  timestamp: number;
  status: LocalTxStatus;
  /** Paid network fee (outgoing, mined only). */
  fee: bigint | null;
  blockNumber: bigint | null;
  /** Known only from this device so far (not yet indexed). */
  local: boolean;
};

// Minimal shapes of the indexer rows we read (Etherscan V2 txlist / tokentx).
export type IndexedNormalTx = {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasUsed: string;
  isError: string;
  txreceipt_status: string;
  input: string;
};

export type IndexedTokenTx = {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  contractAddress: string;
  gasPrice: string;
  gasUsed: string;
};

const TRANSFER_SELECTOR = '0xa9059cbb';

const same = (a: string | undefined, b: string | undefined) =>
  !!a && !!b && a.length === 42 && b.length === 42 && isAddressEqual(a as Address, b as Address);

const fee = (gasUsed: string, gasPrice: string) => {
  try {
    return BigInt(gasUsed) * BigInt(gasPrice);
  } catch {
    return null;
  }
};

function item(
  base: Omit<HistoryItem, 'id' | 'direction' | 'counterparty'>,
  self: Address,
): HistoryItem {
  const direction: TxDirection = same(base.from, self) ? 'out' : 'in';
  return {
    ...base,
    id: `${base.hash}:${base.token}`,
    direction,
    counterparty: direction === 'out' ? base.to : base.from,
  };
}

/**
 * Normal transactions → POL movements, plus *failed* USDT transfers we sent
 * (a reverted transfer emits no Transfer event, so tokentx never shows it).
 */
export function normalizeNormalTx(
  tx: IndexedNormalTx,
  self: Address,
  network: Network,
): HistoryItem | null {
  const failed = tx.isError === '1' || tx.txreceipt_status === '0';
  const outgoing = same(tx.from, self);
  const common = {
    hash: tx.hash as Hash,
    timestamp: Number(tx.timeStamp) * 1000,
    status: (failed ? 'failed' : 'confirmed') as LocalTxStatus,
    fee: outgoing ? fee(tx.gasUsed, tx.gasPrice) : null,
    blockNumber: BigInt(tx.blockNumber),
    local: false,
  };

  const usdt = network.tokens[1].address;
  if (outgoing && usdt && same(tx.to, usdt) && tx.input?.startsWith(TRANSFER_SELECTOR)) {
    try {
      const { args } = decodeFunctionData({ abi: erc20Abi, data: tx.input as Hex });
      const [to, amount] = args as readonly [Address, bigint];
      return item({ ...common, token: 'USDT', from: tx.from as Address, to, amount }, self);
    } catch {
      return null;
    }
  }

  const value = BigInt(tx.value || '0');
  if (value === 0n) return null; // approvals and other contract calls aren't transfers
  if (!same(tx.from, self) && !same(tx.to, self)) return null;
  return item(
    { ...common, token: 'POL', from: tx.from as Address, to: tx.to as Address, amount: value },
    self,
  );
}

/** ERC-20 Transfer events of our USDT contract (anything else is ignored as possible spam). */
export function normalizeTokenTx(
  tx: IndexedTokenTx,
  self: Address,
  network: Network,
): HistoryItem | null {
  const usdt = network.tokens[1].address;
  if (!usdt || !same(tx.contractAddress, usdt)) return null;
  if (!same(tx.from, self) && !same(tx.to, self)) return null;
  const outgoing = same(tx.from, self);
  return item(
    {
      hash: tx.hash as Hash,
      token: 'USDT',
      from: tx.from as Address,
      to: tx.to as Address,
      amount: BigInt(tx.value),
      timestamp: Number(tx.timeStamp) * 1000,
      status: 'confirmed',
      fee: outgoing ? fee(tx.gasUsed, tx.gasPrice) : null,
      blockNumber: BigInt(tx.blockNumber),
      local: false,
    },
    self,
  );
}

export function localToHistoryItem(tx: LocalTx, self: Address): HistoryItem {
  return item(
    {
      hash: tx.hash,
      token: tx.token,
      from: tx.from,
      to: tx.to,
      amount: BigInt(tx.amount),
      timestamp: tx.createdAt,
      status: tx.status,
      fee: null,
      blockNumber: null,
      local: true,
    },
    self,
  );
}

/**
 * Spec §8: indexer history merged with local pending transfers.
 * - the indexer wins when it knows the hash (it has block time, fee, final status);
 * - a local tx replaced by another one (speed-up/cancel) is hidden once the replacement is known;
 * - newest first.
 */
export function mergeHistory(
  indexed: HistoryItem[],
  local: LocalTx[],
  self: Address,
): HistoryItem[] {
  const byId = new Map<string, HistoryItem>();
  for (const entry of indexed) {
    const existing = byId.get(entry.id);
    // tokentx and a decoded txlist row can describe the same USDT transfer; keep the richer one.
    if (!existing || (existing.fee === null && entry.fee !== null)) byId.set(entry.id, entry);
  }
  const indexedHashes = new Set(indexed.map((e) => e.hash.toLowerCase()));

  for (const tx of local) {
    if (indexedHashes.has(tx.hash.toLowerCase())) continue;
    if (tx.replacedBy && indexedHashes.has(tx.replacedBy.toLowerCase())) continue;
    const entry = localToHistoryItem(tx, self);
    if (!byId.has(entry.id)) byId.set(entry.id, entry);
  }

  return [...byId.values()].sort(
    (a, b) =>
      // Pending first among equal times; otherwise newest first.
      b.timestamp - a.timestamp || Number(a.status !== 'pending') - Number(b.status !== 'pending'),
  );
}

export type HistorySection = { key: string; title: string; data: HistoryItem[] };

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** "Today", "Yesterday", "Mon, Nov 3", or "Nov 3, 2025" for other years (local time). */
export function dayTitle(timestamp: number, now: number): string {
  const date = new Date(timestamp);
  const today = new Date(now);
  const yesterday = new Date(now);
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(date) === dayKey(today)) return 'Today';
  if (dayKey(date) === dayKey(yesterday)) return 'Yesterday';
  const sameYear = date.getFullYear() === today.getFullYear();
  return new Intl.DateTimeFormat(
    'en-US',
    sameYear
      ? { weekday: 'short', month: 'short', day: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' },
  ).format(date);
}

/** Spec §7: Activity grouped by day. Expects items sorted newest first. */
export function groupByDay(items: HistoryItem[], now: number): HistorySection[] {
  const sections: HistorySection[] = [];
  for (const entry of items) {
    const key = dayKey(new Date(entry.timestamp));
    const last = sections[sections.length - 1];
    if (last && last.key === key) last.data.push(entry);
    else sections.push({ key, title: dayTitle(entry.timestamp, now), data: [entry] });
  }
  return sections;
}

/** "14:32" in 24h, or "2:32 PM" — follows the device locale. */
export function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(
    new Date(timestamp),
  );
}

/** Home "Recent activity" label: "now", today's time, "Yesterday", or the day. */
export function shortTimeLabel(timestamp: number, now: number): string {
  if (now - timestamp < 60_000 && now >= timestamp) return 'now';
  const title = dayTitle(timestamp, now);
  return title === 'Today' ? formatTime(timestamp) : title;
}

/** "Nov 3, 2026, 14:32" for the details screen. */
export function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}
