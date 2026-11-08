import type { Address } from 'viem';

import { env } from '@/core/chain/env';

import { ApiError, getJson } from './http';

/** Raw item of `account/txlist` (normal transactions). Numbers come as decimal strings. */
export type EtherscanTx = {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasUsed: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  methodId?: string;
};

/** Raw item of `account/tokentx` (ERC-20 Transfer events). */
export type EtherscanTokenTx = {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  contractAddress: string;
  tokenSymbol: string;
  tokenDecimal: string;
  gasPrice: string;
  gasUsed: string;
};

type Envelope<T> = { status: string; message: string; result: T[] | string };

export class MissingApiKeyError extends ApiError {
  constructor() {
    super('http', 'Etherscan API key is missing or invalid');
    this.name = 'MissingApiKeyError';
  }
}

const BASE = 'https://api.etherscan.io/v2/api';
/** Newest-first window per list. Enough for a wallet's recent history in the MVP. */
export const HISTORY_PAGE_SIZE = 50;

async function call<T>(params: Record<string, string | number>): Promise<T[]> {
  const key = env.etherscanKey;
  if (!key) throw new MissingApiKeyError();
  const query = new URLSearchParams({ ...params, apikey: key } as Record<string, string>);
  const body = await getJson<Envelope<T>>(`${BASE}?${query.toString()}`);

  if (body.status === '1' && Array.isArray(body.result)) return body.result;
  // status "0" is also used for a valid empty result.
  if (Array.isArray(body.result) && body.result.length === 0) return [];
  const reason = typeof body.result === 'string' ? body.result : body.message;
  if (/no transactions found/i.test(reason) || /no records/i.test(reason)) return [];
  if (/api key/i.test(reason)) throw new MissingApiKeyError();
  if (/rate limit/i.test(reason)) throw new ApiError('rate_limited', reason);
  throw new ApiError('bad_response', reason || 'Etherscan error');
}

export function fetchNormalTxs(chainId: number, address: Address): Promise<EtherscanTx[]> {
  return call<EtherscanTx>({
    chainid: chainId,
    module: 'account',
    action: 'txlist',
    address,
    page: 1,
    offset: HISTORY_PAGE_SIZE,
    sort: 'desc',
  });
}

/** Only our USDT contract — ignores spam/airdrop tokens sent to the address. */
export function fetchTokenTxs(
  chainId: number,
  address: Address,
  contract: Address,
): Promise<EtherscanTokenTx[]> {
  return call<EtherscanTokenTx>({
    chainid: chainId,
    module: 'account',
    action: 'tokentx',
    contractaddress: contract,
    address,
    page: 1,
    offset: HISTORY_PAGE_SIZE,
    sort: 'desc',
  });
}
