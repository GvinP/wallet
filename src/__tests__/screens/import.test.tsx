import { fireEvent, render, screen } from '@testing-library/react-native';

import ImportScreen from '@/app/(onboarding)/import';
import { onboardingDraft } from '@/stores';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), back: jest.fn() },
}));
jest.mock('expo-screen-capture', () => ({ usePreventScreenCapture: jest.fn() }));
jest.mock('expo-clipboard', () => ({ getStringAsync: jest.fn(async () => '') }));

const VALID = 'test test test test test test test test test test test junk';

describe('Import screen', () => {
  beforeEach(() => {
    mockPush.mockClear();
    onboardingDraft.start('import');
  });

  it('shows the word count and a specific error for unknown words', async () => {
    await render(<ImportScreen />);
    const input = screen.getByLabelText('Recovery phrase');

    await fireEvent.changeText(input, VALID.replace('junk', 'junkk'));
    expect(screen.getByText('12 words')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Continue'));
    expect(
      screen.getByText("Word #12 “junkk” isn't in the recovery word list. Check the spelling."),
    ).toBeOnTheScreen();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('rejects a phrase with a bad checksum', async () => {
    await render(<ImportScreen />);
    await fireEvent.changeText(
      screen.getByLabelText('Recovery phrase'),
      VALID.replace('junk', 'test'),
    );
    await fireEvent.press(screen.getByText('Continue'));
    expect(
      screen.getByText("This phrase isn't valid. Check the order and spelling of the words."),
    ).toBeOnTheScreen();
  });

  it('normalizes a valid phrase into the draft and moves on to the PIN', async () => {
    await render(<ImportScreen />);
    await fireEvent.changeText(
      screen.getByLabelText('Recovery phrase'),
      `  ${VALID.toUpperCase()}\n`,
    );
    await fireEvent.press(screen.getByText('Continue'));
    expect(onboardingDraft.mnemonic).toBe(VALID);
    expect(mockPush).toHaveBeenCalledWith('/set-pin');
  });
});
