import { fireEvent, render, screen } from '@testing-library/react-native';

import SettingsScreen from '@/app/(tabs)/settings';
import { sensitiveGrants, settingsStore } from '@/stores';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...a: unknown[]) => mockPush(...a) } }));
jest.mock('expo-constants', () => ({ expoConfig: { version: '0.1.0' } }));

const mockAuth = jest.fn();
jest.mock('@/core/security', () => ({
  ...jest.requireActual('@/core/security'),
  authenticateWithBiometrics: (...a: unknown[]) => mockAuth(...a),
}));
jest.mock('@/hooks/useBiometryStatus', () => ({
  ...jest.requireActual('@/hooks/useBiometryStatus'),
  useBiometryStatus: () => ({ available: true, kind: 'fingerprint', label: 'Fingerprint' }),
}));
// Stand-in for the PIN sheet: a button that simulates a correct PIN.
jest.mock('@/ui/PinPromptModal', () => ({
  PinPromptModal: ({
    visible,
    title,
    onSuccess,
  }: {
    visible: boolean;
    title: string;
    onSuccess: () => void;
  }) => {
    const { Pressable, Text } = jest.requireActual('react-native');
    return visible ? (
      <Pressable onPress={onSuccess}>
        <Text>{`PIN for: ${title}`}</Text>
      </Pressable>
    ) : null;
  },
}));

describe('Settings screen', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockAuth.mockReset();
    settingsStore.setBiometricsEnabled(false);
    sensitiveGrants.clear();
  });

  it('lists the spec items: network, theme, biometrics, recovery phrase, delete, version', async () => {
    await render(<SettingsScreen />);
    expect(screen.getByLabelText('Network: Polygon Amoy')).toBeOnTheScreen();
    expect(screen.getByLabelText('Theme')).toBeOnTheScreen();
    expect(screen.getByText('Unlock with Fingerprint')).toBeOnTheScreen();
    expect(screen.getByText('Show recovery phrase')).toBeOnTheScreen();
    expect(screen.getByText('Delete wallet')).toBeOnTheScreen();
    expect(screen.getByText('0.1.0 (dev)')).toBeOnTheScreen();
  });

  it('enables biometrics only after a successful biometric check', async () => {
    mockAuth.mockResolvedValueOnce({ success: false, reason: 'cancelled' });
    await render(<SettingsScreen />);
    const toggle = screen.getByLabelText('Unlock with Fingerprint');
    await fireEvent(toggle, 'valueChange', true);
    expect(settingsStore.biometricsEnabled).toBe(false);

    mockAuth.mockResolvedValueOnce({ success: true });
    await fireEvent(toggle, 'valueChange', true);
    expect(settingsStore.biometricsEnabled).toBe(true);

    await fireEvent(toggle, 'valueChange', false);
    expect(settingsStore.biometricsEnabled).toBe(false);
  });

  it('shows the recovery phrase only after the PIN, via a one-time grant', async () => {
    await render(<SettingsScreen />);
    await fireEvent.press(screen.getByText('Show recovery phrase'));
    expect(mockPush).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByText('PIN for: Show recovery phrase'));
    expect(mockPush).toHaveBeenCalledWith('/recovery-phrase');
    expect(sensitiveGrants.consume('revealPhrase')).toBe(true);
  });

  it('delete wallet also goes through the PIN first', async () => {
    await render(<SettingsScreen />);
    await fireEvent.press(screen.getByText('Delete wallet'));
    await fireEvent.press(screen.getByText('PIN for: Delete wallet'));
    expect(mockPush).toHaveBeenCalledWith('/delete-wallet');
    expect(sensitiveGrants.consume('deleteWallet')).toBe(true);
  });
});
