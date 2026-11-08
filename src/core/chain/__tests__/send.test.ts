import { parseUnits, type PublicClient } from 'viem';

import { NETWORKS, type Erc20Token } from '../networks';
import {
  checkFunds,
  checkRecipient,
  estimateTransferFee,
  maxSendable,
  parseAddressInput,
  parseAmount,
  sanitizeAmountInput,
  type FeeEstimate,
} from '../send';

const SELF = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const OTHER = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const POL = NETWORKS.amoy.tokens[0];
const USDT: Erc20Token = {
  ...NETWORKS.amoy.tokens[1],
  address: '0x00000000000000000000000000000000000000aa',
};
const ctx = { self: SELF, chainId: 80002 } as const;

describe('parseAddressInput', () => {
  it.each([
    [OTHER, { address: OTHER }],
    [`  ${OTHER}\n`, { address: OTHER }],
    [`ethereum:${OTHER}`, { address: OTHER }],
    [`ethereum:${OTHER}@80002`, { address: OTHER, chainId: 80002 }],
    [`ethereum:pay-${OTHER}@137`, { address: OTHER, chainId: 137 }],
    [
      `ethereum:0x00000000000000000000000000000000000000aa@80002/transfer?address=${OTHER}&uint256=1`,
      { address: OTHER, chainId: 80002 },
    ],
  ])('%p', (input, expected) => expect(parseAddressInput(input)).toEqual(expected));
});

describe('checkRecipient (spec §6.7)', () => {
  it('accepts a checksummed address', () => {
    expect(checkRecipient(OTHER, ctx)).toEqual({ ok: true, address: OTHER });
  });

  it('accepts all-lowercase (no checksum) and returns it checksummed', () => {
    expect(checkRecipient(OTHER.toLowerCase(), ctx)).toEqual({ ok: true, address: OTHER });
  });

  it('rejects a mixed-case address with a broken checksum', () => {
    const typo = OTHER.replace('C51812', 'c51812');
    expect(checkRecipient(typo, ctx)).toEqual({ ok: false, reason: 'checksum' });
  });

  it.each(['', '   '])('treats %p as empty', (input) =>
    expect(checkRecipient(input, ctx)).toEqual({ ok: false, reason: 'empty' }),
  );

  it.each(['0x123', 'hello', `${OTHER}00`, 'vitalik.eth'])('rejects %p', (input) =>
    expect(checkRecipient(input, ctx)).toEqual({ ok: false, reason: 'invalid' }),
  );

  it('blocks sending to yourself, in any letter case', () => {
    expect(checkRecipient(SELF.toLowerCase(), ctx)).toEqual({ ok: false, reason: 'self' });
  });

  it('rejects a QR for another chain', () => {
    expect(checkRecipient(`ethereum:${OTHER}@137`, ctx)).toEqual({
      ok: false,
      reason: 'wrong_chain',
    });
  });
});

describe('parseAmount', () => {
  it.each([
    ['1', 18, 10n ** 18n],
    ['1.5', 18, 15n * 10n ** 17n],
    ['1,5', 6, 1_500_000n],
    ['.5', 6, 500_000n],
    ['0.000001', 6, 1n],
  ])('%p (%i decimals) → %p', (input, decimals, expected) =>
    expect(parseAmount(input, decimals)).toEqual({ ok: true, amount: expected }),
  );

  it.each([
    ['', 'empty'],
    ['abc', 'invalid'],
    ['1.2.3', 'invalid'],
    ['-1', 'invalid'],
    ['1e3', 'invalid'],
    ['0', 'zero'],
    ['0.000', 'zero'],
    ['0.0000001', 'too_many_decimals'],
  ])('%p → %s', (input, reason) => expect(parseAmount(input, 6)).toEqual({ ok: false, reason }));
});

describe('sanitizeAmountInput', () => {
  it.each([
    ['12,5', '12.5'],
    ['1.2.3', '1.23'],
    ['abc1x', '1'],
    ['0.1234567', '0.123456'],
  ])('%p → %p', (input, expected) => expect(sanitizeAmountInput(input, 6)).toBe(expected));
});

const fee = (gas: bigint, maxFeePerGas: bigint): FeeEstimate => ({
  gas,
  maxFeePerGas,
  maxPriorityFeePerGas: 30n * 10n ** 9n,
  maxFee: gas * maxFeePerGas,
});

describe('maxSendable', () => {
  const f = fee(21_000n, 100n * 10n ** 9n); // 0.0021 POL
  it('POL: balance − fee − 10% buffer', () => {
    const pol = parseUnits('1', 18);
    expect(maxSendable(POL, { token: pol, pol }, f)).toBe(pol - f.maxFee - f.maxFee / 10n);
  });
  it('POL: 0 when the balance does not cover the fee', () => {
    expect(maxSendable(POL, { token: 1000n, pol: 1000n }, f)).toBe(0n);
  });
  it('POL: 0 until a fee estimate exists', () => {
    expect(maxSendable(POL, { token: 10n ** 18n, pol: 10n ** 18n }, null)).toBe(0n);
  });
  it('USDT: the whole token balance', () => {
    expect(maxSendable(USDT, { token: 5_000_000n, pol: 0n }, f)).toBe(5_000_000n);
  });
});

describe('checkFunds', () => {
  const f = fee(21_000n, 10n ** 9n);
  it('POL: amount + fee must fit the balance', () => {
    expect(checkFunds(POL, 100n, { token: 100n, pol: 100n }, f)).toEqual({
      ok: false,
      reason: 'insufficient_gas',
    });
    expect(checkFunds(POL, 200n, { token: 100n, pol: 100n }, f)).toEqual({
      ok: false,
      reason: 'insufficient_token',
    });
    expect(checkFunds(POL, 100n, { token: 0n, pol: 100n + f.maxFee }, f)).toEqual({ ok: true });
  });
  it('USDT: token balance and POL for gas are checked separately', () => {
    expect(checkFunds(USDT, 10n, { token: 5n, pol: 10n ** 18n }, f)).toEqual({
      ok: false,
      reason: 'insufficient_token',
    });
    expect(checkFunds(USDT, 5n, { token: 5n, pol: 0n }, f)).toEqual({
      ok: false,
      reason: 'insufficient_gas',
    });
    expect(checkFunds(USDT, 5n, { token: 5n, pol: f.maxFee }, f)).toEqual({ ok: true });
  });
});

describe('estimateTransferFee', () => {
  const fees = { maxFeePerGas: 60n * 10n ** 9n, maxPriorityFeePerGas: 30n * 10n ** 9n };

  it('POL: estimateGas + EIP-1559 fees from the RPC, no buffer', async () => {
    const client = {
      estimateFeesPerGas: jest.fn(async () => fees),
      estimateGas: jest.fn(async () => 21_000n),
    };
    const result = await estimateTransferFee(client as unknown as PublicClient, {
      token: POL,
      from: SELF,
      to: OTHER,
      amount: 1n,
    });
    expect(client.estimateGas).toHaveBeenCalledWith({ account: SELF, to: OTHER, value: 1n });
    expect(result).toEqual({ gas: 21_000n, ...fees, maxFee: 21_000n * fees.maxFeePerGas });
  });

  it('USDT: estimateContractGas(transfer) + 20% headroom', async () => {
    const client = {
      estimateFeesPerGas: jest.fn(async () => fees),
      estimateContractGas: jest.fn(async () => 50_000n),
    };
    const result = await estimateTransferFee(client as unknown as PublicClient, {
      token: USDT,
      from: SELF,
      to: OTHER,
      amount: 7n,
    });
    expect(client.estimateContractGas).toHaveBeenCalledWith(
      expect.objectContaining({
        account: SELF,
        address: USDT.address,
        functionName: 'transfer',
        args: [OTHER, 7n],
      }),
    );
    expect(result.gas).toBe(60_000n);
    expect(result.maxFee).toBe(60_000n * fees.maxFeePerGas);
  });
});
