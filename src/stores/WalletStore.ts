import { makeAutoObservable } from 'mobx';
import type { Address } from 'viem';

import { storage } from '@/core/storage/mmkv';

const ADDRESS_KEY = 'wallet.address';

/**
 * Public wallet data only. The address is cached in MMKV (not secret) so the lock and
 * home screens never need to touch the seed.
 */
export class WalletStore {
  address: Address | null = (storage.getString(ADDRESS_KEY) as Address | undefined) ?? null;
  readonly accountName = 'Account 1';

  constructor() {
    makeAutoObservable(this);
  }

  setAddress(address: Address) {
    this.address = address;
    storage.set(ADDRESS_KEY, address);
  }

  clear() {
    this.address = null;
    storage.remove(ADDRESS_KEY);
  }
}
