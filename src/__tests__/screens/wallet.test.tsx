import { fireEvent, render, screen } from '@testing-library/react-native';
import { parseUnits } from 'viem';

import WalletScreen from '@/app/(tabs)/wallet';
import { buildPortfolio } from '@/core/chain/portfolio';
import { NETWORKS, type Network } from '@/core/chain/networks';
import type { usePortfolio } from '@/hooks/usePortfolio';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));

type PortfolioResult = ReturnType<typeof usePortfolio>;
let mockResult: PortfolioResult;
jest.mock('@/hooks/usePortfolio', () => ({ usePortfolio: () => mockResult }));

const amoy: Network = {
  ...NETWORKS.amoy,
  tokens: [
    NETWORKS.amoy.tokens[0],
    { ...NETWORKS.amoy.tokens[1], address: '0x00000000000000000000000000000000000000aa' },
  ],
};

function result(overrides: Partial<PortfolioResult> = {}): PortfolioResult {
  return {
    network: amoy,
    portfolio: buildPortfolio(
      amoy,
      { POL: parseUnits('120.5', 18), USDT: parseUnits('200', 6) },
      { POL: 0.4, USDT: 1 },
    ),
    isLoading: false,
    balancesError: null,
    balancesStale: false,
    pricesError: null,
    isRefreshing: false,
    refresh: jest.fn(async () => {}),
    ...overrides,
  };
}

describe('Wallet (home) screen', () => {
  it('shows the total, assets and the testnet banner on Amoy', async () => {
    mockResult = result();
    await render(<WalletScreen />);

    expect(screen.getByLabelText('Total balance')).toHaveTextContent('$248.20');
    expect(screen.getByText('TESTNET · tokens here have no real value')).toBeOnTheScreen();
    expect(screen.getByText('120.50 POL')).toBeOnTheScreen();
    expect(screen.getByText('200.00 USDT')).toBeOnTheScreen();
    expect(screen.getByText('$48.20')).toBeOnTheScreen();
    expect(screen.getByText('$0.40')).toBeOnTheScreen();
    expect(screen.getByLabelText('Network: Polygon Amoy. Change network')).toBeOnTheScreen();
  });

  it('hides the testnet banner on mainnet', async () => {
    const polygon: Network = NETWORKS.polygon;
    mockResult = result({
      network: polygon,
      portfolio: buildPortfolio(polygon, { POL: 0n, USDT: 0n }, { POL: 0.4, USDT: 1 }),
    });
    await render(<WalletScreen />);
    expect(screen.queryByText('TESTNET · tokens here have no real value')).toBeNull();
  });

  it('shows an error with Retry when balances fail', async () => {
    const refresh = jest.fn(async () => {});
    mockResult = result({
      portfolio: buildPortfolio(amoy, undefined, undefined),
      balancesError: new Error('boom'),
      refresh,
    });
    await render(<WalletScreen />);
    expect(screen.getByText("Couldn't load balances. Check your connection.")).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Retry'));
    expect(refresh).toHaveBeenCalled();
  });
});
