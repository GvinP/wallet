import type { Address, Chain } from 'viem';
import { polygon, polygonAmoy } from 'viem/chains';

import { env } from './env';

/**
 * Spec §11: mainnet stays off until phase 5 (sending on Amoy) is accepted.
 * The config exists so the switcher and data layer are network-agnostic from day one.
 */
export const MAINNET_ENABLED = false;

export type NetworkId = 'amoy' | 'polygon';
export type TokenSymbol = 'POL' | 'USDT';

type TokenBase = {
  symbol: TokenSymbol;
  name: string;
  decimals: number;
  /** CoinGecko id for the USD price (verified: polygon-ecosystem-token, tether). */
  coingeckoId: string;
};

export type NativeToken = TokenBase & { kind: 'native' };
export type Erc20Token = TokenBase & {
  kind: 'erc20';
  /** undefined when not configured (e.g. MockUSDT on Amoy before it's deployed). */
  address: Address | undefined;
};
export type Token = NativeToken | Erc20Token;

export type Network = {
  id: NetworkId;
  chain: Chain;
  name: string;
  shortName: string;
  isTestnet: boolean;
  rpcUrl: string;
  explorerUrl: string;
  tokens: readonly [NativeToken, Erc20Token];
};

const POL: NativeToken = {
  kind: 'native',
  symbol: 'POL',
  name: 'Polygon',
  decimals: 18,
  coingeckoId: 'polygon-ecosystem-token',
};

const usdt = (address: Address | undefined): Erc20Token => ({
  kind: 'erc20',
  symbol: 'USDT',
  name: 'Tether USD',
  decimals: 6,
  coingeckoId: 'tether',
  address,
});

export const NETWORKS: Record<NetworkId, Network> = {
  amoy: {
    id: 'amoy',
    chain: polygonAmoy,
    name: 'Polygon Amoy',
    shortName: 'Amoy',
    isTestnet: true,
    rpcUrl: env.rpcAmoy ?? polygonAmoy.rpcUrls.default.http[0],
    explorerUrl: 'https://amoy.polygonscan.com',
    // Our own MockUSDT (ERC-20, 6 decimals) — see docs (phase 5).
    tokens: [POL, usdt(env.usdtAmoy)],
  },
  polygon: {
    id: 'polygon',
    chain: polygon,
    name: 'Polygon',
    shortName: 'Polygon',
    isTestnet: false,
    rpcUrl: env.rpcPolygon ?? polygon.rpcUrls.default.http[0],
    explorerUrl: 'https://polygonscan.com',
    // TODO(before enabling mainnet): re-verify on polygonscan — Tether moved to USDT0 in 2025.
    tokens: [POL, usdt('0xc2132D05D31c914a87C6611C10748AEb04B58e8F')],
  },
};

export const DEFAULT_NETWORK: NetworkId = 'amoy';

export function isNetworkAvailable(id: NetworkId): boolean {
  return id === 'amoy' || MAINNET_ENABLED;
}

export function explorerAddressUrl(network: Network, address: string): string {
  return `${network.explorerUrl}/address/${address}`;
}

export function explorerTxUrl(network: Network, hash: string): string {
  return `${network.explorerUrl}/tx/${hash}`;
}
