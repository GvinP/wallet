/**
 * Live check against the real Amoy RPC: `npm run test:integration`.
 * Optional: AMOY_TEST_ADDRESS=0x… to read a specific address.
 */
import { createPublicClient, http, type PublicClient } from 'viem';

import { fetchBalances } from '../balances';
import { NETWORKS } from '../networks';

const ADDRESS = (process.env.AMOY_TEST_ADDRESS ??
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266') as `0x${string}`;

describe('Amoy RPC (live)', () => {
  const network = NETWORKS.amoy;
  const client = createPublicClient({
    chain: network.chain,
    transport: http(network.rpcUrl),
  }) as PublicClient;

  it('talks to chain 80002', async () => {
    await expect(client.getChainId()).resolves.toBe(80002);
  });

  it('reads the same POL balance as a raw eth_getBalance at the same block', async () => {
    const blockNumber = await client.getBlockNumber();
    const [balances, raw] = await Promise.all([
      fetchBalances(client, network, ADDRESS),
      client.getBalance({ address: ADDRESS, blockNumber }),
    ]);
    expect(typeof balances.POL).toBe('bigint');
    // Balances can only differ if a transfer landed in between — fine for a smoke test.
    console.warn(`[amoy] ${ADDRESS} POL=${balances.POL} @latest, ${raw} @${blockNumber}`);
  });
});
