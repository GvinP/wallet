import { fireEvent, render, screen } from '@testing-library/react-native';

import { PinEntryScreen } from '@/ui/PinEntryScreen';

jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));

async function typePin(pin: string) {
  for (const digit of pin) {
    await fireEvent.press(screen.getByLabelText(digit));
  }
}

describe('PinEntryScreen', () => {
  it('submits once all 6 digits are entered', async () => {
    const onComplete = jest.fn(() => null);
    await render(<PinEntryScreen title="Create a PIN" subtitle="" onComplete={onComplete} />);

    await typePin('12345');
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByLabelText('5 of 6 digits entered')).toBeOnTheScreen();

    await typePin('6');
    expect(onComplete).toHaveBeenCalledWith('123456');
    expect(screen.getByLabelText('0 of 6 digits entered')).toBeOnTheScreen();
  });

  it('supports delete', async () => {
    const onComplete = jest.fn(() => null);
    await render(<PinEntryScreen title="t" subtitle="" onComplete={onComplete} />);
    await typePin('123');
    await fireEvent.press(screen.getByLabelText('Delete'));
    expect(screen.getByLabelText('2 of 6 digits entered')).toBeOnTheScreen();
  });

  it('shows the error returned by onComplete', async () => {
    await render(
      <PinEntryScreen
        title="Confirm your PIN"
        subtitle=""
        onComplete={async () => "PINs don't match. Try again."}
      />,
    );
    await typePin('111111');
    expect(screen.getByText("PINs don't match. Try again.")).toBeOnTheScreen();
  });
});
