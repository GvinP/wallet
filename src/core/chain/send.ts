import {
  erc20Abi,
  getAddress,
  isAddress,
  isAddressEqual,
  parseUnits,
  type Address,
  type PublicClient,
} from 'viem';

import type { Token } from './networks';

// ───────────────────────── recipient ─────────────────────────

export type RecipientCheck =
  | { ok: true; address: Address }
  | { ok: false; reason: 'empty' | 'invalid' | 'checksum' | 'self' | 'wrong_chain' };

/**
 * Accepts a bare address or an EIP-681 URI as produced by wallet QR codes:
 * `ethereum:0xabc…`, `ethereum:0xabc…@80002`, `ethereum:0xToken@137/transfer?address=0xabc…`.
 * Returns the recipient candidate and the chain id if the URI carries one.
 */
export function parseAddressInput(raw: string): { address: string; chainId?: number } {
  const text = raw.trim();
  const uri = /^ethereum:(?:pay-)?(0x[0-9a-fA-F]{40})(?:@(\d+))?(\/transfer)?(?:\?(.*))?$/.exec(
    text,
  );
  if (!uri) return { address: text };
  const [, target, chain, transfer, query] = uri;
  const chainId = chain ? Number(chain) : undefined;
  if (transfer && query) {
    const recipient = new URLSearchParams(query).get('address');
    if (recipient) return { address: recipient, chainId };
  }
  return { address: target!, chainId };
}

/**
 * Spec §6.7: `isAddress` with checksum validation; sending to yourself is blocked.
 * All-lowercase/uppercase addresses carry no checksum and are accepted (as MetaMask does);
 * mixed case must have a valid EIP-55 checksum.
 */
export function checkRecipient(
  raw: string,
  { self, chainId }: { self: Address; chainId: number },
): RecipientCheck {
  const parsed = parseAddressInput(raw);
  if (!parsed.address) return { ok: false, reason: 'empty' };
  if (parsed.chainId !== undefined && parsed.chainId !== chainId) {
    return { ok: false, reason: 'wrong_chain' };
  }
  if (!isAddress(parsed.address, { strict: false })) return { ok: false, reason: 'invalid' };
  if (!isAddress(parsed.address, { strict: true })) return { ok: false, reason: 'checksum' };
  const address = getAddress(parsed.address);
  if (isAddressEqual(address, self)) return { ok: false, reason: 'self' };
  return { ok: true, address };
}

// ───────────────────────── amount ─────────────────────────

export type AmountCheck =
  | { ok: true; amount: bigint }
  | { ok: false; reason: 'empty' | 'invalid' | 'too_many_decimals' | 'zero' };

/** "1,5" → 1.5 (comma keyboards); strict digits only — no floats ever touch the value. */
export function parseAmount(raw: string, decimals: number): AmountCheck {
  const text = raw.trim().replace(',', '.');
  if (!text) return { ok: false, reason: 'empty' };
  if (!/^(\d+\.?\d*|\.\d+)$/.test(text)) return { ok: false, reason: 'invalid' };
  const fraction = text.split('.')[1] ?? '';
  if (fraction.length > decimals) return { ok: false, reason: 'too_many_decimals' };
  const amount = parseUnits(text.startsWith('.') ? `0${text}` : text, decimals);
  if (amount === 0n) return { ok: false, reason: 'zero' };
  return { ok: true, amount };
}

/** Keeps only what the amount field may contain; caps fraction digits at the token decimals. */
export function sanitizeAmountInput(raw: string, decimals: number): string {
  let text = raw.replace(',', '.').replace(/[^\d.]/g, '');
  const firstDot = text.indexOf('.');
  if (firstDot !== -1) {
    text = text.slice(0, firstDot + 1) + text.slice(firstDot + 1).replace(/\./g, '');
    const [whole, fraction = ''] = text.split('.');
    text = `${whole}.${fraction.slice(0, decimals)}`;
  }
  return text;
}

// ───────────────────────── fees ─────────────────────────

export type FeeEstimate = {
  gas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  /** Upper bound we reserve: gas × maxFeePerGas. The actual fee is usually lower. */
  maxFee: bigint;
};

/** Contract calls get headroom; a plain POL transfer to an EOA is exactly 21 000 gas. */
const CONTRACT_GAS_BUFFER_PCT = 20n;

export type TransferRequest = {
  token: Token;
  from: Address;
  to: Address;
  amount: bigint;
};

/**
 * EIP-1559 estimate from the RPC. Polygon enforces a high minimum priority fee (≈25–30 gwei);
 * we use whatever eth_maxPriorityFeePerGas returns instead of hard-coding it (spec §8).
 */
export async function estimateTransferFee(
  client: PublicClient,
  { token, from, to, amount }: TransferRequest,
): Promise<FeeEstimate> {
  const feesPromise = client.estimateFeesPerGas();
  let gas: bigint;
  if (token.kind === 'native') {
    gas = await client.estimateGas({ account: from, to, value: amount });
  } else {
    const raw = await client.estimateContractGas({
      account: from,
      address: token.address!,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [to, amount],
    });
    gas = raw + (raw * CONTRACT_GAS_BUFFER_PCT) / 100n;
  }
  const { maxFeePerGas, maxPriorityFeePerGas } = await feesPromise;
  return { gas, maxFeePerGas, maxPriorityFeePerGas, maxFee: gas * maxFeePerGas };
}

/** Extra safety on top of maxFee when computing "Max" for POL (base fee can jump between blocks). */
const MAX_POL_FEE_BUFFER_PCT = 10n;

/** Spec §7: for POL, Max = balance − fee estimate; for tokens, the whole token balance. */
export function maxSendable(
  token: Token,
  balances: { token: bigint; pol: bigint },
  fee: FeeEstimate | null,
): bigint {
  if (token.kind !== 'native') return balances.token;
  if (!fee) return 0n;
  const reserve = fee.maxFee + (fee.maxFee * MAX_POL_FEE_BUFFER_PCT) / 100n;
  return balances.pol > reserve ? balances.pol - reserve : 0n;
}

export type FundsCheck =
  { ok: true } | { ok: false; reason: 'insufficient_token' | 'insufficient_gas' };

/** Spec §7: enough of the token AND enough POL for the fee. */
export function checkFunds(
  token: Token,
  amount: bigint,
  balances: { token: bigint; pol: bigint },
  fee: FeeEstimate,
): FundsCheck {
  if (token.kind === 'native') {
    if (amount > balances.pol) return { ok: false, reason: 'insufficient_token' };
    if (amount + fee.maxFee > balances.pol) return { ok: false, reason: 'insufficient_gas' };
    return { ok: true };
  }
  if (amount > balances.token) return { ok: false, reason: 'insufficient_token' };
  if (fee.maxFee > balances.pol) return { ok: false, reason: 'insufficient_gas' };
  return { ok: true };
}
