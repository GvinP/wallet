import { formatUnits } from 'viem';

/**
 * Money math stays in integers. Token amounts are bigint base units; USD values are bigint
 * cents. The only float is the market price, converted once to a fixed-point integer.
 */
const PRICE_DECIMALS = 8;

export function priceToFixed(priceUsd: number): bigint {
  if (!Number.isFinite(priceUsd) || priceUsd < 0) throw new Error('Invalid price');
  return BigInt(Math.round(priceUsd * 10 ** PRICE_DECIMALS));
}

/** amount (base units) × price → USD cents, rounded half up. */
export function toUsdCents(amount: bigint, decimals: number, priceUsd: number): bigint {
  const scaled = amount * priceToFixed(priceUsd); // decimals + 8
  const divisor = 10n ** BigInt(decimals + PRICE_DECIMALS - 2);
  return (scaled + divisor / 2n) / divisor;
}

const groupThousands = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** 24820n → "$248.20", 123456789n → "$1,234,567.89" */
export function formatUsdCents(cents: bigint): string {
  const negative = cents < 0n;
  const abs = negative ? -cents : cents;
  const dollars = groupThousands((abs / 100n).toString());
  const rest = (abs % 100n).toString().padStart(2, '0');
  return `${negative ? '−' : ''}$${dollars}.${rest}`;
}

/** Market price: "$1.00", "$1,234.56", "$0.2134", "$0.00001234". */
export function formatUsdPrice(priceUsd: number): string {
  if (priceUsd >= 1) {
    const [whole, fraction] = priceUsd.toFixed(2).split('.');
    return `$${groupThousands(whole!)}.${fraction}`;
  }
  if (!(priceUsd > 0)) return '$0.00';
  // 4 significant digits for sub-dollar prices, without exponent notation.
  const digits = Math.min(20, 3 - Math.floor(Math.log10(priceUsd)));
  const [whole, fraction = ''] = priceUsd.toFixed(digits).split('.');
  return `$${whole}.${fraction.replace(/0+$/, '').padEnd(2, '0')}`;
}

/**
 * Token amount for display, truncated (never rounded up — don't show more than you have).
 * 120500000000000000000n, 18 → "120.5"; minFraction pads: 200000000n, 6, {min:2} → "200.00".
 */
export function formatTokenAmount(
  amount: bigint,
  decimals: number,
  { maxFraction = 4, minFraction = 0 }: { maxFraction?: number; minFraction?: number } = {},
): string {
  const [whole, fraction = ''] = formatUnits(amount, decimals).split('.');
  let frac = fraction.slice(0, maxFraction).replace(/0+$/, '');
  const grouped = groupThousands(whole!.replace('-', ''));
  const sign = whole!.startsWith('-') ? '−' : '';
  if (frac === '' && amount > 0n && grouped === '0') {
    // Dust below the shown precision: say so instead of a misleading "0".
    return `<0.${'0'.repeat(maxFraction - 1)}1`;
  }
  if (frac.length < minFraction) frac = frac.padEnd(minFraction, '0');
  return `${sign}${grouped}${frac ? `.${frac}` : ''}`;
}
