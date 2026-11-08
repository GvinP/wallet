import { createPublicClient, http, type PublicClient } from 'viem';

import { NETWORKS, type NetworkId } from './networks';

const cache = new Map<NetworkId, PublicClient>();

/** One read-only client per network, created lazily. */
export function getPublicClient(id: NetworkId): PublicClient {
  let client = cache.get(id);
  if (!client) {
    const network = NETWORKS[id];
    client = createPublicClient({
      chain: network.chain,
      transport: http(network.rpcUrl, { retryCount: 2, timeout: 15_000 }),
      batch: { multicall: true },
    }) as PublicClient;
    cache.set(id, client);
  }
  return client;
}
