import { fireEvent, render, screen } from '@testing-library/react-native';
import { usePreventScreenCapture } from 'expo-screen-capture';

import DeleteWalletScreen from '@/app/delete-wallet';
import ForgotPinScreen from '@/app/forgot-pin';
import RecoveryPhraseScreen from '@/app/recovery-phrase';
import { onboardingDraft, sensitiveGrants, sessionStore } from '@/stores';

const mockRedirect = jest.fn();
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  Redirect: ({ href }: { href: string }) => {
    mockRedirect(href);
    return null;
  },
}));
jest.mock('expo-screen-capture', () => ({ usePreventScreenCapture: jest.fn() }));

const PHRASE = 'test test test test test test test test test test test junk';
jest.mock('@/core/security', () => ({
  ...jest.requireActual('@/core/security'),
  vault: { revealMnemonic: jest.fn(async () => PHRASE) },
}));

beforeEach(() => {
  mockRedirect.mockClear();
  sensitiveGrants.clear();
  onboardingDraft.clear();
});

describe('Recovery phrase screen', () => {
  it('cannot be opened without the PIN grant (e.g. via deep link)', async () => {
    await render(<RecoveryPhraseScreen />);
    expect(mockRedirect).toHaveBeenCalledWith('/settings');
    expect(screen.queryByText('junk')).toBeNull();
  });

  it('with the grant: screenshots blocked, words hidden until "Show phrase"', async () => {
    sensitiveGrants.grant('revealPhrase');
    await render(<RecoveryPhraseScreen />);
    expect(usePreventScreenCapture).toHaveBeenCalled();
    expect(screen.queryByText('junk')).toBeNull();

    await fireEvent.press(screen.getByLabelText('Show recovery phrase'));
    expect(screen.getByText('junk')).toBeOnTheScreen();
    expect(screen.getAllByText('test')).toHaveLength(11);
  });

  it('a grant opens the screen only once', async () => {
    sensitiveGrants.grant('revealPhrase');
    const first = await render(<RecoveryPhraseScreen />);
    await first.unmount();
    await render(<RecoveryPhraseScreen />);
    expect(mockRedirect).toHaveBeenCalledWith('/settings');
  });
});

describe('Delete wallet screen', () => {
  it('requires the PIN grant', async () => {
    await render(<DeleteWalletScreen />);
    expect(mockRedirect).toHaveBeenCalledWith('/settings');
  });

  it('requires an explicit confirmation, then resets the wallet', async () => {
    const reset = jest.spyOn(sessionStore, 'resetWallet').mockResolvedValue();
    sensitiveGrants.grant('deleteWallet');
    await render(<DeleteWalletScreen />);

    const button = screen.getByRole('button', { name: 'Delete wallet' });
    expect(button).toBeDisabled();
    await fireEvent.press(screen.getByText('I have my recovery phrase written down'));
    expect(button).toBeEnabled();
    await fireEvent.press(button);
    expect(reset).toHaveBeenCalledTimes(1);
    reset.mockRestore();
  });
});

describe('Forgot PIN screen', () => {
  it('resets the wallet and continues to import', async () => {
    const reset = jest
      .spyOn(sessionStore, 'resetWallet')
      .mockImplementation(async (before?: () => void) => before?.());
    await render(<ForgotPinScreen />);
    await fireEvent.press(screen.getByText('I have my recovery phrase'));
    await fireEvent.press(screen.getByText('Reset and import'));
    expect(reset).toHaveBeenCalled();
    expect(onboardingDraft.mode).toBe('import');
    reset.mockRestore();
  });
});
