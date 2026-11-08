import { fireEvent, render, screen } from '@testing-library/react-native';

import ConfirmScreen from '@/app/send/confirm';
import { sendDraft, settingsStore, walletStore } from '@/stores';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: { replace: (...a: unknown[]) => mockReplace(...a), back: jest.fn() },
  Redirect: () => null,
}));

const mockAuth = jest.fn();
jest.mock('@/core/security', () => ({
  ...jest.requireActual('@/core/security'),
  authenticateWithBiometrics: (...a: unknown[]) => mockAuth(...a),
}));
jest.mock('@/hooks/useBiometryStatus', () => ({
  ...jest.requireActual('@/hooks/useBiometryStatus'),
  useBiometryStatus: () => ({ available: true, kind: 'faceId', label: 'Face ID' }),
}));
jest.mock('@/hooks/usePortfolio', () => ({
  usePrices: () => ({ data: { POL: 0.4, USDT: 1 } }),
}));
jest.mock('@/ui/PinPromptModal', () => ({
  PinPromptModal: ({ visible, title }: { visible: boolean; title: string }) => {
    const { Text } = jest.requireActual('react-native');
    return visible ? <Text>{`PIN prompt: ${title}`}</Text> : null;
  },
}));

const TO = '0x51bC0000000000000000000000000000000004Ad';

describe('Send confirm screen', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockAuth.mockReset();
    walletStore.setAddress('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    settingsStore.setBiometricsEnabled(true);
    sendDraft.reset();
    sendDraft.setReview({
      networkId: 'amoy',
      token: 'POL',
      to: TO,
      amount: 25n * 10n ** 18n,
      fee: {
        gas: 21_000n,
        maxFeePerGas: 150n * 10n ** 9n,
        maxPriorityFeePerGas: 30n * 10n ** 9n,
        maxFee: 3_150_000n * 10n ** 9n, // 0.00315 POL
      },
    });
  });

  it('shows amount, recipient, network and fee like the mockup', async () => {
    await render(<ConfirmScreen />);
    expect(screen.getByLabelText('Amount')).toHaveTextContent('25.00 POL');
    expect(screen.getByText('≈ $10.00')).toBeOnTheScreen();
    expect(screen.getByText('0x51bC…04Ad')).toBeOnTheScreen();
    expect(screen.getByLabelText('Network: Polygon Amoy')).toBeOnTheScreen();
    expect(screen.getByText('0.00315 POL')).toBeOnTheScreen();
    expect(screen.getByText('≈ $0.0013')).toBeOnTheScreen();
    expect(
      screen.getByText("Check the address carefully. Blockchain transfers can't be reversed."),
    ).toBeOnTheScreen();
  });

  it('authorizes and moves to the status screen after successful biometrics', async () => {
    mockAuth.mockResolvedValue({ success: true });
    await render(<ConfirmScreen />);
    await fireEvent.press(screen.getByText('Confirm'));
    expect(mockAuth).toHaveBeenCalledWith('Send 25.00 POL');
    expect(sendDraft.phase).toBe('authorized');
    expect(mockReplace).toHaveBeenCalledWith('/send/status');
  });

  it('falls back to the PIN when biometrics are cancelled — nothing is authorized yet', async () => {
    mockAuth.mockResolvedValue({ success: false, reason: 'cancelled' });
    await render(<ConfirmScreen />);
    await fireEvent.press(screen.getByText('Confirm'));
    expect(screen.getByText('PIN prompt: Confirm transfer')).toBeOnTheScreen();
    expect(sendDraft.phase).toBe('editing');
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('goes straight to the PIN when biometrics are turned off', async () => {
    settingsStore.setBiometricsEnabled(false);
    await render(<ConfirmScreen />);
    await fireEvent.press(screen.getByText('Confirm'));
    expect(mockAuth).not.toHaveBeenCalled();
    expect(screen.getByText('PIN prompt: Confirm transfer')).toBeOnTheScreen();
  });
});
