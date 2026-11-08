import { validateMnemonic } from '@/core/wallet';

import { formatCountdown, mnemonicErrorText } from '../copy';

const VALID = 'test test test test test test test test test test test junk';

function errorFor(input: string) {
  const result = validateMnemonic(input);
  if (result.ok) throw new Error('expected invalid');
  return mnemonicErrorText(result);
}

describe('mnemonicErrorText', () => {
  it('explains each failure', () => {
    expect(errorFor('')).toBe('Enter your recovery phrase.');
    expect(errorFor('test test')).toBe('Recovery phrases have 12 or 24 words — you entered 2.');
    expect(errorFor(VALID.replace('junk', 'junkk'))).toBe(
      "Word #12 “junkk” isn't in the recovery word list. Check the spelling.",
    );
    expect(errorFor(VALID.replace(/^test test/, 'tset tset'))).toBe(
      "Words #1 “tset”, #2 “tset” aren't in the recovery word list. Check the spelling.",
    );
    expect(errorFor(VALID.replace('junk', 'test'))).toBe(
      "This phrase isn't valid. Check the order and spelling of the words.",
    );
  });
});

describe('formatCountdown', () => {
  it.each([
    [30_000, '0:30'],
    [29_001, '0:30'],
    [60_000, '1:00'],
    [3_600_000, '60:00'],
    [-5, '0:00'],
  ])('%p → %p', (ms, text) => expect(formatCountdown(ms)).toBe(text));
});
