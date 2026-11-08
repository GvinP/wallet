import type { MnemonicValidation } from '@/core/wallet';

/** User-facing message for an invalid recovery phrase. Never echoes the full phrase. */
export function mnemonicErrorText(result: Exclude<MnemonicValidation, { ok: true }>): string {
  switch (result.reason) {
    case 'empty':
      return 'Enter your recovery phrase.';
    case 'word_count':
      return `Recovery phrases have 12 or 24 words — you entered ${result.wordCount}.`;
    case 'unknown_words': {
      const list = result.unknownWords.map((w) => `#${w.index + 1} “${w.word}”`).join(', ');
      return result.unknownWords.length === 1
        ? `Word ${list} isn't in the recovery word list. Check the spelling.`
        : `Words ${list} aren't in the recovery word list. Check the spelling.`;
    }
    case 'checksum':
      return "This phrase isn't valid. Check the order and spelling of the words.";
  }
}

export function recipientErrorText(
  reason: 'empty' | 'invalid' | 'checksum' | 'self' | 'wrong_chain',
): string | null {
  switch (reason) {
    case 'empty':
      return null;
    case 'invalid':
      return "That's not a valid Polygon address.";
    case 'checksum':
      return 'This address has a typo (checksum mismatch). Copy it again from the source.';
    case 'self':
      return "This is your own address. Sending to yourself would only cost a fee, so it's blocked.";
    case 'wrong_chain':
      return 'This QR code is for a different network.';
  }
}

export function amountErrorText(
  reason: 'empty' | 'invalid' | 'too_many_decimals' | 'zero',
  token: { symbol: string; decimals: number },
): string | null {
  switch (reason) {
    case 'empty':
      return null;
    case 'invalid':
      return 'Enter a number.';
    case 'too_many_decimals':
      return `${token.symbol} supports up to ${token.decimals} decimal places.`;
    case 'zero':
      return 'Enter an amount greater than 0.';
  }
}

export function fundsErrorText(
  reason: 'insufficient_token' | 'insufficient_gas',
  token: { symbol: string; kind: 'native' | 'erc20' },
): string {
  if (reason === 'insufficient_token') return `Not enough ${token.symbol}.`;
  return token.kind === 'native'
    ? 'Not enough POL for this amount plus the network fee. Try Max.'
    : 'Not enough POL to pay the network fee. Top up a little POL first.';
}

/** "4:59" / "0:30" */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
