import { encodeFunctionData, erc20Abi, type Address } from 'viem';

import {
  dayTitle,
  groupByDay,
  mergeHistory,
  normalizeNormalTx,
  normalizeTokenTx,
  shortTimeLabel,
  type HistoryItem,
  type IndexedNormalTx,
  type IndexedTokenTx,
} from '../history';
import { NETWORKS, type Network } from '../networks';
import type { LocalTx } from '../pendingTx';

const SELF: Address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const OTHER: Address = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const USDT: Address = '0x00000000000000000000000000000000000000Aa';
const SPAM: Address = '0x00000000000000000000000000000000000000bB';
const network: Network = {
  ...NETWORKS.amoy,
  tokens: [NETWORKS.amoy.tokens[0], { ...NETWORKS.amoy.tokens[1], address: USDT }],
};
const h = (n: number) => `0x${n.toString(16).padStart(64, '0')}` as const;

const normal = (over: Partial<IndexedNormalTx>): IndexedNormalTx => ({
  blockNumber: '100',
  timeStamp: '1762600000',
  hash: h(1),
  from: OTHER.toLowerCase(),
  to: SELF.toLowerCase(),
  value: '50000000000000000000',
  gasPrice: '30000000000',
  gasUsed: '21000',
  isError: '0',
  txreceipt_status: '1',
  input: '0x',
  ...over,
});

const token = (over: Partial<IndexedTokenTx>): IndexedTokenTx => ({
  blockNumber: '101',
  timeStamp: '1762600100',
  hash: h(2),
  from: SELF.toLowerCase(),
  to: OTHER.toLowerCase(),
  value: '25000000',
  contractAddress: USDT.toLowerCase(),
  gasPrice: '30000000000',
  gasUsed: '50000',
  ...over,
});

describe('normalizeNormalTx', () => {
  it('incoming POL (lower-case addresses from the indexer)', () => {
    expect(normalizeNormalTx(normal({}), SELF, network)).toMatchObject({
      id: `${h(1)}:POL`,
      token: 'POL',
      direction: 'in',
      counterparty: OTHER.toLowerCase(),
      amount: 50n * 10n ** 18n,
      timestamp: 1762600000_000,
      status: 'confirmed',
      fee: null,
    });
  });

  it('outgoing POL carries the paid fee', () => {
    const item = normalizeNormalTx(
      normal({ from: SELF.toLowerCase(), to: OTHER.toLowerCase() }),
      SELF,
      network,
    );
    expect(item).toMatchObject({ direction: 'out', fee: 21000n * 30_000_000_000n });
  });

  it('marks reverted transactions as failed', () => {
    expect(normalizeNormalTx(normal({ isError: '1' }), SELF, network)?.status).toBe('failed');
  });

  it('skips zero-value contract calls such as approve()', () => {
    expect(
      normalizeNormalTx(
        normal({ from: SELF, to: USDT, value: '0', input: '0x095ea7b3' }),
        SELF,
        network,
      ),
    ).toBeNull();
  });

  it('decodes our failed USDT transfer (no Transfer event exists for it)', () => {
    const input = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [OTHER, 7_000_000n],
    });
    const item = normalizeNormalTx(
      normal({ from: SELF, to: USDT.toLowerCase(), value: '0', input, isError: '1' }),
      SELF,
      network,
    );
    expect(item).toMatchObject({
      token: 'USDT',
      direction: 'out',
      to: OTHER,
      amount: 7_000_000n,
      status: 'failed',
    });
  });
});

describe('normalizeTokenTx', () => {
  it('maps our USDT Transfer events', () => {
    expect(normalizeTokenTx(token({}), SELF, network)).toMatchObject({
      id: `${h(2)}:USDT`,
      direction: 'out',
      amount: 25_000_000n,
      status: 'confirmed',
      fee: 50000n * 30_000_000_000n,
    });
  });

  it('ignores other tokens (spam airdrops)', () => {
    expect(normalizeTokenTx(token({ contractAddress: SPAM }), SELF, network)).toBeNull();
  });

  it('ignores everything when USDT is not configured', () => {
    expect(normalizeTokenTx(token({}), SELF, NETWORKS.amoy)).toBeNull();
  });
});

describe('mergeHistory', () => {
  const local = (over: Partial<LocalTx>): LocalTx => ({
    hash: h(9),
    networkId: 'amoy',
    from: SELF,
    to: OTHER,
    token: 'POL',
    amount: '1000',
    createdAt: 1762700000_000,
    status: 'pending',
    ...over,
  });

  it('shows a local pending transfer the indexer does not know yet, on top', () => {
    const indexed = [normalizeNormalTx(normal({}), SELF, network)!];
    const merged = mergeHistory(indexed, [local({})], SELF);
    expect(merged.map((i) => [i.hash, i.status, i.local])).toEqual([
      [h(9), 'pending', true],
      [h(1), 'confirmed', false],
    ]);
  });

  it('lets the indexer win once it has the same hash', () => {
    const indexed = [
      normalizeNormalTx(normal({ hash: h(9), from: SELF, to: OTHER }), SELF, network)!,
    ];
    const merged = mergeHistory(indexed, [local({ status: 'pending' })], SELF);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ status: 'confirmed', local: false });
  });

  it('hides a local tx that was replaced by an indexed one (speed-up/cancel)', () => {
    const indexed = [
      normalizeNormalTx(normal({ hash: h(5), from: SELF, to: OTHER }), SELF, network)!,
    ];
    const merged = mergeHistory(indexed, [local({ replacedBy: h(5), status: 'confirmed' })], SELF);
    expect(merged.map((i) => i.hash)).toEqual([h(5)]);
  });

  it('dedupes a USDT transfer seen in both txlist and tokentx', () => {
    const input = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [OTHER, 25_000_000n],
    });
    const fromTxList = normalizeNormalTx(
      normal({ hash: h(2), from: SELF, to: USDT, value: '0', input }),
      SELF,
      network,
    )!;
    const fromTokenTx = normalizeTokenTx(token({}), SELF, network)!;
    expect(mergeHistory([fromTxList, fromTokenTx], [], SELF)).toHaveLength(1);
  });

  it('keeps local transfers of the selected network only (caller filters), newest first', () => {
    const merged = mergeHistory(
      [],
      [local({ hash: h(7), createdAt: 1 }), local({ hash: h(8), createdAt: 2 })],
      SELF,
    );
    expect(merged.map((i) => i.hash)).toEqual([h(8), h(7)]);
  });
});

describe('day grouping', () => {
  const now = new Date(2026, 10, 8, 15, 0).getTime(); // Sun, Nov 8 2026, 15:00 local
  const at = (d: number, hh = 12) => new Date(2026, 10, d, hh, 0).getTime();
  const row = (ts: number, n: number): HistoryItem => ({
    ...normalizeNormalTx(normal({ hash: h(n) }), SELF, network)!,
    id: String(n),
    timestamp: ts,
  });

  it('titles days like the spec: Today / Yesterday / weekday / other year', () => {
    expect(dayTitle(at(8, 1), now)).toBe('Today');
    expect(dayTitle(at(7, 23), now)).toBe('Yesterday');
    expect(dayTitle(at(3), now)).toBe('Tue, Nov 3');
    expect(dayTitle(new Date(2025, 0, 2).getTime(), now)).toBe('Jan 2, 2025');
  });

  it('groups consecutive items by local day', () => {
    const sections = groupByDay(
      [row(at(8, 14), 1), row(at(8, 9), 2), row(at(7), 3), row(at(3), 4)],
      now,
    );
    expect(sections.map((s) => [s.title, s.data.length])).toEqual([
      ['Today', 2],
      ['Yesterday', 1],
      ['Tue, Nov 3', 1],
    ]);
  });

  it('short labels for the home screen', () => {
    expect(shortTimeLabel(now - 10_000, now)).toBe('now');
    expect(shortTimeLabel(at(7), now)).toBe('Yesterday');
  });
});
