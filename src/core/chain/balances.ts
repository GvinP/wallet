import { erc20Abi, type Address, type PublicClient } from 'viem';

import type { Network, TokenSymbol } from './networks';

/** Raw on-chain balances in base units. null = token not configured on this network. */
export type Balances = Record<TokenSymbol, bigint | null>;

/**
 * POL via eth_getBalance, USDT via balanceOf. Both reads are issued together;
 * viem batches the contract read through Multicall3.
 */
export async function fetchBalances(
  client: PublicClient,
  network: Network,
  address: Address,
): Promise<Balances> {
  const [native, usdt] = network.tokens;
  const [pol, usdtBalance] = await Promise.all([
    client.getBalance({ address }),
    usdt.address
      ? client.readContract({
          address: usdt.address,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address],
        })
      : Promise.resolve(null),
  ]);
  return { [native.symbol]: pol, [usdt.symbol]: usdtBalance } as Balances;
}
