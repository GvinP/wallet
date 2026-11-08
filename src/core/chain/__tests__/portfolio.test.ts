import { parseUnits } from 'viem';

import { NETWORKS, type Network } from '../networks';
import { buildPortfolio } from '../portfolio';

const withUsdt: Network = {
  ...NETWORKS.amoy,
  tokens: [
    NETWORKS.amoy.tokens[0],
    { ...NETWORKS.amoy.tokens[1], address: '0x0000000000000000000000000000000000000001' },
  ],
};

describe('buildPortfolio', () => {
  it('reproduces the mockup numbers: 120.5 POL @ $0.40 + 200 USDT @ $1 = $248.20', () => {
    const p = buildPortfolio(
      withUsdt,
      { POL: parseUnits('120.5', 18), USDT: parseUnits('200', 6) },
      { POL: 0.4, USDT: 1 },
    );
    expect(p.totalCents).toBe(24820n);
    expect(p.totalIsPartial).toBe(false);
    expect(p.assets.map((a) => a.valueCents)).toEqual([4820n, 20000n]);
  });

  it('has no total while balances are loading', () => {
    const p = buildPortfolio(withUsdt, undefined, { POL: 0.4, USDT: 1 });
    expect(p.totalCents).toBeNull();
    expect(p.assets.every((a) => a.amount === null)).toBe(true);
  });

  it('marks the total partial when a held asset has no price', () => {
    const p = buildPortfolio(
      withUsdt,
      { POL: parseUnits('1', 18), USDT: parseUnits('5', 6) },
      { POL: null, USDT: 1 },
    );
    expect(p.totalCents).toBe(500n);
    expect(p.totalIsPartial).toBe(true);
  });

  it('flags USDT as not configured when the Amoy contract address is missing', () => {
    const noUsdt: Network = {
      ...NETWORKS.amoy,
      tokens: [NETWORKS.amoy.tokens[0], { ...NETWORKS.amoy.tokens[1], address: undefined }],
    };
    const p = buildPortfolio(noUsdt, { POL: 0n, USDT: null }, { POL: 0.4, USDT: 1 });
    expect(p.assets[1]).toMatchObject({ configured: false, amount: null, valueCents: null });
    expect(p.totalCents).toBe(0n);
  });
});
