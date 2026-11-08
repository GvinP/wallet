import { SendDraft, type ReviewedTransfer } from '../SendDraft';

const review: ReviewedTransfer = {
  networkId: 'amoy',
  token: 'POL',
  to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  amount: 1n,
  fee: { gas: 21_000n, maxFeePerGas: 1n, maxPriorityFeePerGas: 1n, maxFee: 21_000n },
};

describe('SendDraft authorization', () => {
  it('cannot be consumed without authorization', () => {
    const d = new SendDraft();
    d.setReview(review);
    expect(d.consumeAuthorization()).toBeNull();
  });

  it('is consumed exactly once (no double send)', () => {
    const d = new SendDraft();
    d.setReview(review);
    d.authorize(1000);
    expect(d.consumeAuthorization(1500)).toBe(review);
    expect(d.phase).toBe('sending');
    expect(d.consumeAuthorization(1600)).toBeNull();
  });

  it('expires after a minute', () => {
    const d = new SendDraft();
    d.setReview(review);
    d.authorize(0);
    expect(d.consumeAuthorization(60_001)).toBeNull();
    expect(d.phase).toBe('editing');
  });

  it('changing the review drops a previous authorization', () => {
    const d = new SendDraft();
    d.setReview(review);
    d.authorize(0);
    d.setReview({ ...review, amount: 2n });
    expect(d.consumeAuthorization(1)).toBeNull();
  });

  it('switching tokens clears the amount', () => {
    const d = new SendDraft();
    d.setAmount('5');
    d.setToken('USDT');
    expect(d.amount).toBe('');
  });
});
