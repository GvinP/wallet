import { isAddress, type Address } from 'viem';

// EXPO_PUBLIC_* vars are inlined at build time and must be read as literal
// `process.env.EXPO_PUBLIC_…` expressions — no dynamic access.

const nonEmpty = (value: string | undefined) => (value && value.trim() ? value.trim() : undefined);

const address = (value: string | undefined): Address | undefined => {
  const v = nonEmpty(value);
  return v && isAddress(v) ? v : undefined;
};

export const env = {
  rpcAmoy: nonEmpty(process.env.EXPO_PUBLIC_RPC_AMOY),
  rpcPolygon: nonEmpty(process.env.EXPO_PUBLIC_RPC_POLYGON),
  usdtAmoy: address(process.env.EXPO_PUBLIC_USDT_AMOY),
  etherscanKey: nonEmpty(process.env.EXPO_PUBLIC_ETHERSCAN_KEY),
  coingeckoKey: nonEmpty(process.env.EXPO_PUBLIC_COINGECKO_KEY),
};
