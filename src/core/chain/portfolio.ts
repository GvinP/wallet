import type { Balances } from './balances';
import { toUsdCents } from './money';
import type { Network, Token, TokenSymbol } from './networks';

export type AssetView = {
  token: Token;
  /** false = token has no contract configured on this network (e.g. MockUSDT not deployed yet). */
  configured: boolean;
  amount: bigint | null;
  priceUsd: number | null;
  valueCents: bigint | null;
};

export type Portfolio = {
  assets: AssetView[];
  /** null until balances are known; prices missing → only priced assets are summed. */
  totalCents: bigint | null;
  /** Some held asset has no price, so the total is incomplete. */
  totalIsPartial: boolean;
};

export function buildPortfolio(
  network: Network,
  balances: Balances | undefined,
  prices: Record<TokenSymbol, number | null> | undefined,
): Portfolio {
  let total: bigint | null = balances ? 0n : null;
  let partial = false;

  const assets = network.tokens.map((token): AssetView => {
    const configured = token.kind === 'native' || token.address !== undefined;
    const amount = balances?.[token.symbol] ?? null;
    const priceUsd = prices?.[token.symbol] ?? null;
    const valueCents =
      amount !== null && priceUsd !== null ? toUsdCents(amount, token.decimals, priceUsd) : null;

    if (total !== null) {
      if (valueCents !== null) total += valueCents;
      else if (amount !== null && amount > 0n) partial = true;
    }
    return { token, configured, amount, priceUsd, valueCents };
  });

  return { assets, totalCents: total, totalIsPartial: partial };
}
