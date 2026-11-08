import { parseUnits } from 'viem';

import {
  formatTokenAmount,
  formatUsdCents,
  formatUsdMicros,
  formatUsdPrice,
  toUsdCents,
  toUsdMicros,
} from '../money';

describe('toUsdCents', () => {
  it('multiplies base units by price without float drift', () => {
    // 120.5 POL × $0.40 = $48.20
    expect(toUsdCents(parseUnits('120.5', 18), 18, 0.4)).toBe(4820n);
    // 200 USDT × $1.00 = $200.00
    expect(toUsdCents(parseUnits('200', 6), 6, 1)).toBe(20000n);
    // 0.1 + 0.2 style trap: 0.3 POL × $0.1 = $0.03
    expect(toUsdCents(parseUnits('0.3', 18), 18, 0.1)).toBe(3n);
  });

  it('rounds half up to the cent', () => {
    expect(toUsdCents(parseUnits('1', 6), 6, 0.005)).toBe(1n); // 0.5¢ → 1¢
    expect(toUsdCents(parseUnits('1', 6), 6, 0.0049)).toBe(0n);
  });

  it('handles huge balances exactly', () => {
    expect(toUsdCents(parseUnits('123456789.123456', 6), 6, 1)).toBe(12345678912n);
  });

  it('rejects invalid prices', () => {
    expect(() => toUsdCents(1n, 18, Number.NaN)).toThrow();
    expect(() => toUsdCents(1n, 18, -1)).toThrow();
  });
});

describe('formatUsdCents', () => {
  it.each([
    [0n, '$0.00'],
    [5n, '$0.05'],
    [24820n, '$248.20'],
    [123456789n, '$1,234,567.89'],
  ])('%p → %p', (cents, text) => expect(formatUsdCents(cents)).toBe(text));
});

describe('formatUsdPrice', () => {
  it.each([
    [1, '$1.00'],
    [1234.5, '$1,234.50'],
    [0.4, '$0.40'],
    [0.2134567, '$0.2135'],
    [0.00001234, '$0.00001234'],
    [0, '$0.00'],
  ])('%p → %p', (price, text) => expect(formatUsdPrice(price)).toBe(text));
});

describe('formatTokenAmount', () => {
  it('truncates instead of rounding up', () => {
    expect(formatTokenAmount(parseUnits('1.99999', 18), 18, { maxFraction: 4 })).toBe('1.9999');
  });

  it('pads to a minimum fraction', () => {
    expect(formatTokenAmount(parseUnits('200', 6), 6, { maxFraction: 2, minFraction: 2 })).toBe(
      '200.00',
    );
    expect(formatTokenAmount(parseUnits('120.5', 18), 18, { minFraction: 2 })).toBe('120.50');
  });

  it('groups thousands', () => {
    expect(formatTokenAmount(parseUnits('1234567.5', 18), 18)).toBe('1,234,567.5');
  });

  it('marks dust instead of showing 0', () => {
    expect(formatTokenAmount(1n, 18, { maxFraction: 4, minFraction: 2 })).toBe('<0.0001');
  });

  it('shows zero as zero', () => {
    expect(formatTokenAmount(0n, 18, { minFraction: 2 })).toBe('0.00');
  });
});

describe('fee-sized USD (micro-dollars)', () => {
  it('keeps sub-cent precision', () => {
    // 0.0031 POL × $0.40 = $0.00124
    const micros = toUsdMicros(parseUnits('0.0031', 18), 18, 0.4);
    expect(micros).toBe(1240n);
    expect(formatUsdMicros(micros)).toBe('$0.0012');
  });
  it.each([
    [0n, '$0.00'],
    [50n, '<$0.0001'],
    [10_000n, '$0.01'],
    [25_000_000n, '$25.00'],
  ])('%p → %p', (micros, text) => expect(formatUsdMicros(micros)).toBe(text));
});
