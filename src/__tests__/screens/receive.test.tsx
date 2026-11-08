import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';

import ReceiveScreen from '@/app/receive';
import { walletStore } from '@/stores';

jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(async () => true) }));

const mockQr = jest.fn();
jest.mock('react-native-qrcode-svg', () => {
  const { View } = jest.requireActual('react-native');
  return function MockQRCode(props: { value: string; testID?: string }) {
    mockQr(props);
    return <View testID={props.testID} />;
  };
});

const ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

describe('Receive screen', () => {
  beforeEach(() => {
    walletStore.setAddress(ADDRESS);
    mockQr.mockClear();
  });

  it('renders the network, the QR with the address and the full address text', async () => {
    await render(<ReceiveScreen />);
    expect(screen.getByLabelText('Network: Polygon Amoy')).toBeOnTheScreen();
    expect(mockQr).toHaveBeenCalledWith(expect.objectContaining({ value: ADDRESS }));
    expect(screen.getByText(ADDRESS)).toBeOnTheScreen();
    expect(screen.getByText(/on the Polygon Amoy network/)).toBeOnTheScreen();
  });

  it('copies the full address', async () => {
    await render(<ReceiveScreen />);
    await fireEvent.press(screen.getByText('Copy'));
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(ADDRESS);
    expect(screen.getByText('Copied')).toBeOnTheScreen();
  });

  it('opens the share sheet with the address', async () => {
    const share = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: 'sharedAction', activityType: undefined });
    await render(<ReceiveScreen />);
    await fireEvent.press(screen.getByText('Share'));
    expect(share).toHaveBeenCalledWith({
      message: `My Polygon Amoy address (POL and USDT):\n${ADDRESS}`,
    });
  });
});
