import { makeAutoObservable, runInAction } from 'mobx';
import type { PublicClient } from 'viem';

import type { NetworkId } from '@/core/chain/networks';
import { trackTransaction, type LocalTx, type TrackResult } from '@/core/chain/pendingTx';
import { storage } from '@/core/storage/mmkv';

const KEY = 'pendingTx.v1';
/** Keep settled local txs a while so history can merge them until the indexer catches up. */
const KEEP_SETTLED_MS = 24 * 60 * 60_000;
const MAX_ITEMS = 50;

type Deps = {
  getClient: (id: NetworkId) => PublicClient;
  now?: () => number;
  track?: (client: PublicClient, hash: LocalTx['hash']) => Promise<TrackResult>;
  /** Called when a tx settles (refresh balances/history). */
  onSettled?: (tx: LocalTx) => void;
};

/**
 * Transfers sent from this device, persisted in MMKV (not secret) so pending ones survive
 * restarts and keep being tracked (spec §8).
 */
export class PendingTxStore {
  items: LocalTx[] = [];
  private readonly tracking = new Set<string>();
  private readonly deps: Required<Omit<Deps, 'onSettled'>> & Pick<Deps, 'onSettled'>;

  constructor(deps: Deps) {
    this.deps = { now: Date.now, track: (c, h) => trackTransaction(c, h), ...deps };
    this.items = this.load();
    makeAutoObservable<this, 'tracking' | 'deps'>(this, { tracking: false, deps: false });
  }

  forNetwork(networkId: NetworkId): LocalTx[] {
    return this.items.filter((tx) => tx.networkId === networkId);
  }

  add(tx: Omit<LocalTx, 'status' | 'createdAt'>) {
    const entry: LocalTx = { ...tx, status: 'pending', createdAt: this.deps.now() };
    this.items = [entry, ...this.items.filter((t) => t.hash !== tx.hash)].slice(0, MAX_ITEMS);
    this.persist();
    void this.track(entry);
  }

  /** Call on app start / unlock: resumes tracking everything still pending. */
  resume() {
    this.prune();
    for (const tx of this.items) if (tx.status === 'pending') void this.track(tx);
  }

  private async track(tx: LocalTx) {
    const key = `${tx.networkId}:${tx.hash}`;
    if (this.tracking.has(key)) return;
    this.tracking.add(key);
    try {
      const result = await this.deps.track(this.deps.getClient(tx.networkId), tx.hash);
      if (result.status === 'pending') return; // timed out; resume() retries later
      runInAction(() => {
        const item = this.items.find((t) => t.hash === tx.hash);
        if (!item) return;
        item.status = result.status;
        item.settledAt = this.deps.now();
        if (result.replacedBy) item.replacedBy = result.replacedBy;
        this.persist();
        this.deps.onSettled?.(item);
      });
    } catch {
      // RPC hiccup — stay pending; resume() retries on the next start/unlock.
    } finally {
      this.tracking.delete(key);
    }
  }

  private prune() {
    const cutoff = this.deps.now() - KEEP_SETTLED_MS;
    const kept = this.items.filter((t) => t.status === 'pending' || (t.settledAt ?? 0) > cutoff);
    if (kept.length !== this.items.length) {
      this.items = kept;
      this.persist();
    }
  }

  private load(): LocalTx[] {
    try {
      const raw = storage.getString(KEY);
      const parsed = raw ? (JSON.parse(raw) as LocalTx[]) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persist() {
    storage.set(KEY, JSON.stringify(this.items));
  }
}
