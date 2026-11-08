import { env } from '@/core/chain/env';
import { NETWORKS, type TokenSymbol } from '@/core/chain/networks';

import { ApiError, getJson } from './http';

export type Prices = Record<TokenSymbol, number | null>;

const TOKENS = NETWORKS.amoy.tokens; // same tokens on every network
const IDS = TOKENS.map((t) => t.coingeckoId).join(',');

type SimplePriceResponse = Record<string, { usd?: number } | undefined>;

/**
 * CoinGecko simple price. On Amoy we deliberately show real mainnet prices
 * "for looks" (spec §8) — testnet tokens have no market.
 */
export async function fetchPrices(): Promise<Prices> {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${IDS}&vs_currencies=usd`;
  const headers = env.coingeckoKey ? { 'x-cg-demo-api-key': env.coingeckoKey } : undefined;
  const data = await getJson<SimplePriceResponse>(url, { headers });
  if (typeof data !== 'object' || data === null) throw new ApiError('bad_response', 'Bad prices');

  const prices = {} as Prices;
  for (const token of TOKENS) {
    const usd = data[token.coingeckoId]?.usd;
    prices[token.symbol] = typeof usd === 'number' && Number.isFinite(usd) ? usd : null;
  }
  return prices;
}
