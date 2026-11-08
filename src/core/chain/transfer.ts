import {
  BaseError,
  createWalletClient,
  erc20Abi,
  ExecutionRevertedError,
  FeeCapTooLowError,
  HttpRequestError,
  InsufficientFundsError,
  IntrinsicGasTooLowError,
  NonceTooLowError,
  TimeoutError,
  TipAboveFeeCapError,
  http,
  type Hash,
  type LocalAccount,
} from 'viem';

import type { Network } from './networks';
import type { FeeEstimate, TransferRequest } from './send';

/**
 * Signs and broadcasts. POL → sendTransaction, USDT → writeContract(transfer) (spec §8).
 * Uses the gas/fee values the user saw on the confirm screen.
 */
export async function sendTransfer(
  network: Network,
  account: LocalAccount,
  { token, to, amount }: Omit<TransferRequest, 'from'>,
  fee: FeeEstimate,
): Promise<Hash> {
  const wallet = createWalletClient({
    account,
    chain: network.chain,
    transport: http(network.rpcUrl, { retryCount: 0, timeout: 20_000 }),
  });
  const feeParams = {
    gas: fee.gas,
    maxFeePerGas: fee.maxFeePerGas,
    maxPriorityFeePerGas: fee.maxPriorityFeePerGas,
  };
  if (token.kind === 'native') {
    return wallet.sendTransaction({ to, value: amount, ...feeParams });
  }
  return wallet.writeContract({
    address: token.address!,
    abi: erc20Abi,
    functionName: 'transfer',
    args: [to, amount],
    ...feeParams,
  });
}

export type SendErrorKind =
  'insufficient_funds' | 'fee_too_low' | 'nonce' | 'reverted' | 'network' | 'unknown';

/** Maps viem/RPC errors to something we can explain. Never includes keys or raw payloads. */
export function classifySendError(error: unknown): SendErrorKind {
  if (!(error instanceof BaseError)) return 'unknown';
  const match = (types: (abstract new (...args: never[]) => Error)[]) =>
    error.walk((e) => types.some((t) => e instanceof t)) !== null;

  if (match([InsufficientFundsError])) return 'insufficient_funds';
  if (match([FeeCapTooLowError, TipAboveFeeCapError, IntrinsicGasTooLowError])) {
    return 'fee_too_low';
  }
  if (match([NonceTooLowError])) return 'nonce';
  if (match([ExecutionRevertedError])) return 'reverted';
  if (match([HttpRequestError, TimeoutError])) return 'network';
  // Some RPCs return plain-text errors that viem can't classify.
  const text = `${error.shortMessage} ${error.details ?? ''}`.toLowerCase();
  if (text.includes('insufficient funds')) return 'insufficient_funds';
  if (text.includes('nonce too low') || text.includes('already known')) return 'nonce';
  if (text.includes('underpriced') || text.includes('fee cap')) return 'fee_too_low';
  return 'unknown';
}

export const SEND_ERROR_TEXT: Record<SendErrorKind, string> = {
  insufficient_funds: "You don't have enough POL to cover the amount and the network fee.",
  fee_too_low: 'The network fee changed. Go back and review the transfer again.',
  nonce:
    'Another transaction from this wallet is still being processed. Wait a moment and try again.',
  reverted: 'The token contract rejected this transfer. Check the amount and the token balance.',
  // The node may have accepted the transaction before the connection failed — be honest.
  network:
    "Couldn't reach the network. Check Activity before trying again — the transfer may still go through.",
  unknown: 'Something went wrong while sending. Check Activity before trying again.',
};
