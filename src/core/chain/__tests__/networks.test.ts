import {
  DEFAULT_NETWORK,
  explorerTxUrl,
  isNetworkAvailable,
  MAINNET_ENABLED,
  NETWORKS,
} from '../networks';

describe('networks', () => {
  it('matches the spec table', () => {
    expect(NETWORKS.amoy.chain.id).toBe(80002);
    expect(NETWORKS.polygon.chain.id).toBe(137);
    for (const n of Object.values(NETWORKS)) {
      expect(n.tokens[0]).toMatchObject({ symbol: 'POL', decimals: 18, kind: 'native' });
      expect(n.tokens[1]).toMatchObject({ symbol: 'USDT', decimals: 6, kind: 'erc20' });
    }
    expect(NETWORKS.amoy.explorerUrl).toBe('https://amoy.polygonscan.com');
    expect(NETWORKS.polygon.explorerUrl).toBe('https://polygonscan.com');
  });

  it('defaults to Amoy and keeps mainnet off until phase 5 is accepted (spec §11)', () => {
    expect(DEFAULT_NETWORK).toBe('amoy');
    expect(MAINNET_ENABLED).toBe(false);
    expect(isNetworkAvailable('amoy')).toBe(true);
    expect(isNetworkAvailable('polygon')).toBe(false);
  });

  it('builds explorer links', () => {
    expect(explorerTxUrl(NETWORKS.amoy, '0xabc')).toBe('https://amoy.polygonscan.com/tx/0xabc');
  });
});
