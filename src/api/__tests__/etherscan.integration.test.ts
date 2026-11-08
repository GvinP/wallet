/**
 * Live Etherscan V2 check for Amoy — needs a key:
 *   EXPO_PUBLIC_ETHERSCAN_KEY=… npm run test:integration
 * Optional: AMOY_TEST_ADDRESS=0x… (defaults to the public "test … junk" account).
 */
import type { Address } from 'viem';

import { normalizeNormalTx } from '../../core/chain/history';
import { NETWORKS } from '../../core/chain/networks';
import { fetchNormalTxs } from '../etherscan';

const run = process.env.EXPO_PUBLIC_ETHERSCAN_KEY ? describe : describe.skip;
const ADDRESS = (process.env.AMOY_TEST_ADDRESS ??
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266') as Address;

run('Etherscan V2 on Amoy (live)', () => {
  it('returns txlist rows that our normalizer understands', async () => {
    const rows = await fetchNormalTxs(80002, ADDRESS);
    expect(Array.isArray(rows)).toBe(true);
    const items = rows.map((r) => normalizeNormalTx(r, ADDRESS, NETWORKS.amoy));
    console.warn(`[etherscan] ${rows.length} rows, ${items.filter(Boolean).length} transfers`);
  });
});
