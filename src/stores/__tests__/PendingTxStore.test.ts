import type { PublicClient } from 'viem';

import type { TrackResult } from '@/core/chain/pendingTx';
import { storage } from '@/core/storage/mmkv';

import { PendingTxStore } from '../PendingTxStore';

const HASH = `0x${'ab'.repeat(32)}` as const;
const TX = {
  hash: HASH,
  networkId: 'amoy' as const,
  from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as const,
  to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as const,
  token: 'POL' as const,
  amount: '1000',
};

const flush = () => new Promise((r) => setTimeout(r, 0));

function deferred() {
  let resolve!: (r: TrackResult) => void;
  const promise = new Promise<TrackResult>((r) => (resolve = r));
  return { promise, resolve };
}

beforeEach(() => storage.clearAll());

describe('PendingTxStore', () => {
  it('adds as pending immediately, then settles to confirmed', async () => {
    const d = deferred();
    const onSettled = jest.fn();
    const store = new PendingTxStore({
      getClient: () => ({}) as PublicClient,
      track: () => d.promise,
      onSettled,
    });

    store.add(TX);
    expect(store.forNetwork('amoy')).toEqual([expect.objectContaining({ status: 'pending' })]);
    expect(store.forNetwork('polygon')).toEqual([]);

    d.resolve({ status: 'confirmed' });
    await flush();
    expect(store.items[0]!.status).toBe('confirmed');
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it('survives a restart and resumes tracking pending transactions', async () => {
    const first = new PendingTxStore({
      getClient: () => ({}) as PublicClient,
      track: () => new Promise(() => {}), // app killed while pending
    });
    first.add(TX);

    const track = jest.fn(async (): Promise<TrackResult> => ({ status: 'failed' }));
    const restarted = new PendingTxStore({ getClient: () => ({}) as PublicClient, track });
    expect(restarted.items[0]).toMatchObject({ hash: HASH, status: 'pending' });

    restarted.resume();
    await flush();
    expect(track).toHaveBeenCalledTimes(1);
    expect(restarted.items[0]!.status).toBe('failed');
  });

  it('stays pending when tracking times out or the RPC fails', async () => {
    const store = new PendingTxStore({
      getClient: () => ({}) as PublicClient,
      track: jest
        .fn<Promise<TrackResult>, []>()
        .mockResolvedValueOnce({ status: 'pending' })
        .mockRejectedValueOnce(new Error('rpc down')),
    });
    store.add(TX);
    await flush();
    expect(store.items[0]!.status).toBe('pending');
    store.resume();
    await flush();
    expect(store.items[0]!.status).toBe('pending');
  });

  it('records a replacement (speed-up/cancel)', async () => {
    const replacement = `0x${'cd'.repeat(32)}` as const;
    const store = new PendingTxStore({
      getClient: () => ({}) as PublicClient,
      track: async () => ({ status: 'confirmed', replacedBy: replacement }),
    });
    store.add(TX);
    await flush();
    expect(store.items[0]).toMatchObject({ status: 'confirmed', replacedBy: replacement });
  });

  it('prunes settled transactions after a day, keeps pending ones', async () => {
    let now = 0;
    const store = new PendingTxStore({
      getClient: () => ({}) as PublicClient,
      now: () => now,
      track: async (_c, hash) => (hash === HASH ? { status: 'confirmed' } : { status: 'pending' }),
    });
    store.add(TX);
    store.add({ ...TX, hash: `0x${'ef'.repeat(32)}` });
    await flush();
    now = 25 * 60 * 60_000;
    store.resume();
    expect(store.items.map((t) => t.status)).toEqual(['pending']);
  });
});
