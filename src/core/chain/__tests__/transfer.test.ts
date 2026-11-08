import {
  BaseError,
  ExecutionRevertedError,
  FeeCapTooLowError,
  HttpRequestError,
  InsufficientFundsError,
  NonceTooLowError,
  TransactionExecutionError,
} from 'viem';

import { classifySendError, SEND_ERROR_TEXT } from '../transfer';

const wrap = (cause: BaseError) =>
  new TransactionExecutionError(cause, { account: undefined } as never);

describe('classifySendError', () => {
  it.each([
    [wrap(new InsufficientFundsError()), 'insufficient_funds'],
    [wrap(new FeeCapTooLowError()), 'fee_too_low'],
    [wrap(new NonceTooLowError()), 'nonce'],
    [wrap(new ExecutionRevertedError()), 'reverted'],
    [new HttpRequestError({ url: 'https://rpc' }), 'network'],
    [new BaseError('insufficient funds for gas * price + value'), 'insufficient_funds'],
    [new BaseError('replacement transaction underpriced'), 'fee_too_low'],
    [new BaseError('something odd'), 'unknown'],
    [new Error('not a viem error'), 'unknown'],
  ] as const)('%#: → %s', (error, kind) => {
    expect(classifySendError(error)).toBe(kind);
    expect(SEND_ERROR_TEXT[kind]).toBeTruthy();
  });
});
