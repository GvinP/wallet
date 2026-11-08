import {
  TransactionReceiptNotFoundError,
  WaitForTransactionReceiptTimeoutError,
  type PublicClient,
} from 'viem';

import { trackTransaction } from '../pendingTx';

const HASH = `0x${'ab'.repeat(32)}` as const;
const REPLACEMENT = `0x${'cd'.repeat(32)}` as const;

type WaitArgs = { onReplaced?: (r: { reason: string; transaction: { hash: string } }) => void };

const client = (impl: (args: WaitArgs) => Promise<unknown>) =>
  ({ waitForTransactionReceipt: jest.fn(impl) }) as unknown as PublicClient;

describe('trackTransaction', () => {
  it('success receipt → confirmed', async () => {
    await expect(
      trackTransaction(
        client(async () => ({ status: 'success' })),
        HASH,
      ),
    ).resolves.toEqual({ status: 'confirmed' });
  });

  it('reverted receipt → failed', async () => {
    await expect(
      trackTransaction(
        client(async () => ({ status: 'reverted' })),
        HASH,
      ),
    ).resolves.toEqual({ status: 'failed' });
  });

  it('follows a replacement (speed-up/cancel) and reports it', async () => {
    const c = client(async ({ onReplaced }) => {
      onReplaced?.({ reason: 'cancelled', transaction: { hash: REPLACEMENT } });
      return { status: 'success' };
    });
    await expect(trackTransaction(c, HASH)).resolves.toEqual({
      status: 'confirmed',
      replacedBy: REPLACEMENT,
    });
  });

  it('a mere gas re-price is not reported as a replacement', async () => {
    const c = client(async ({ onReplaced }) => {
      onReplaced?.({ reason: 'repriced', transaction: { hash: REPLACEMENT } });
      return { status: 'success' };
    });
    await expect(trackTransaction(c, HASH)).resolves.toEqual({ status: 'confirmed' });
  });

  it('timeouts and unknown receipts stay pending (retried later)', async () => {
    await expect(
      trackTransaction(
        client(async () => {
          throw new WaitForTransactionReceiptTimeoutError({ hash: HASH });
        }),
        HASH,
      ),
    ).resolves.toEqual({ status: 'pending' });
    await expect(
      trackTransaction(
        client(async () => {
          throw new TransactionReceiptNotFoundError({ hash: HASH });
        }),
        HASH,
      ),
    ).resolves.toEqual({ status: 'pending' });
  });

  it('other errors propagate (the store keeps the tx pending)', async () => {
    await expect(
      trackTransaction(
        client(async () => {
          throw new Error('rpc down');
        }),
        HASH,
      ),
    ).rejects.toThrow('rpc down');
  });
});
