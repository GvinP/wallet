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

/** "4:59" / "0:30" */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
