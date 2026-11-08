import { fireEvent, render, screen } from '@testing-library/react-native';

import ActivityScreen from '@/app/(tabs)/activity';
import type { HistoryItem } from '@/core/chain/history';
import { NETWORKS } from '@/core/chain/networks';
import type { useHistory } from '@/hooks/useHistory';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...a: unknown[]) => mockPush(...a) } }));

type HistoryResult = ReturnType<typeof useHistory>;
let mockHistory: HistoryResult;
jest.mock('@/hooks/useHistory', () => ({ useHistory: () => mockHistory }));

const SELF = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const OTHER = '0x51bC0000000000000000000000000000000004Ad';
const now = Date.now();

const tx = (over: Partial<HistoryItem>): HistoryItem => ({
  id: 'x',
  hash: `0x${'1'.repeat(64)}`,
  token: 'USDT',
  direction: 'out',
  counterparty: OTHER,
  from: SELF,
  to: OTHER,
  amount: 25_000_000n,
  timestamp: now,
  status: 'pending',
  fee: null,
  blockNumber: null,
  local: true,
  ...over,
});

function history(over: Partial<HistoryResult> = {}): HistoryResult {
  return {
    network: NETWORKS.amoy,
    items: [],
    missingKey: false,
    isLoading: false,
    error: null,
    isRefreshing: false,
    refresh: jest.fn(async () => {}),
    ...over,
  };
}

describe('Activity screen', () => {
  beforeEach(() => mockPush.mockClear());

  it('groups by day and shows the mockup rows with statuses', async () => {
    mockHistory = history({
      items: [
        tx({ id: 'a' }),
        tx({
          id: 'b',
          hash: `0x${'2'.repeat(64)}`,
          token: 'POL',
          direction: 'in',
          counterparty: '0x9E020000000000000000000000000000000071Fa',
          amount: 50n * 10n ** 18n,
          timestamp: now - 24 * 60 * 60_000,
          status: 'confirmed',
          local: false,
        }),
      ],
    });
    await render(<ActivityScreen />);

    expect(screen.getByText('TODAY')).toBeOnTheScreen();
    expect(screen.getByText('YESTERDAY')).toBeOnTheScreen();
    expect(screen.getByText('Sent USDT')).toBeOnTheScreen();
    expect(screen.getByText('−25.00 USDT')).toBeOnTheScreen();
    expect(screen.getByText('Pending')).toBeOnTheScreen();
    expect(screen.getByText('Received POL')).toBeOnTheScreen();
    expect(screen.getByText('+50.00 POL')).toBeOnTheScreen();
    expect(screen.getByText('Confirmed')).toBeOnTheScreen();
  });

  it('opens transaction details on tap', async () => {
    mockHistory = history({ items: [tx({ id: 'a' })] });
    await render(<ActivityScreen />);
    await fireEvent.press(screen.getByText('Sent USDT'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/tx/[hash]',
      params: { hash: `0x${'1'.repeat(64)}`, token: 'USDT' },
    });
  });

  it('explains the missing API key and shows the empty state', async () => {
    mockHistory = history({ missingKey: true });
    await render(<ActivityScreen />);
    expect(screen.getByText(/Add an Etherscan API key/)).toBeOnTheScreen();
    expect(screen.getByText('No activity yet')).toBeOnTheScreen();
  });

  it('shows an error with Retry', async () => {
    const refresh = jest.fn(async () => {});
    mockHistory = history({ error: new Error('boom'), refresh });
    await render(<ActivityScreen />);
    await fireEvent.press(screen.getByText('Retry'));
    expect(refresh).toHaveBeenCalled();
  });
});
