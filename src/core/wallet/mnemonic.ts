import { generateMnemonic as scureGenerate, validateMnemonic as scureValidate } from '@scure/bip39';
import { wordlist as english } from '@scure/bip39/wordlists/english';

export const SUPPORTED_WORD_COUNTS = [12, 24] as const;
export type WordCount = (typeof SUPPORTED_WORD_COUNTS)[number];

const STRENGTH_BITS: Record<WordCount, number> = { 12: 128, 24: 256 };
const WORDS = new Set(english);

export const BIP39_WORDLIST: readonly string[] = english;

/** New random mnemonic. Uses crypto.getRandomValues (polyfilled on RN). */
export function generateMnemonic(wordCount: WordCount = 12): string {
  return scureGenerate(english, STRENGTH_BITS[wordCount]);
}

/** Lower-case, trim and collapse any whitespace (incl. newlines from pasting) to single spaces. */
export function normalizeMnemonic(input: string): string {
  return input.normalize('NFKD').trim().toLowerCase().split(/\s+/).filter(Boolean).join(' ');
}

export function splitMnemonic(mnemonic: string): string[] {
  const normalized = normalizeMnemonic(mnemonic);
  return normalized ? normalized.split(' ') : [];
}

export type MnemonicValidation =
  | { ok: true; mnemonic: string }
  | { ok: false; reason: 'empty' }
  | { ok: false; reason: 'word_count'; wordCount: number }
  | { ok: false; reason: 'unknown_words'; unknownWords: { index: number; word: string }[] }
  | { ok: false; reason: 'checksum' };

/**
 * Full BIP39 check with a reason the UI can show:
 * word count (12/24) → every word in the English wordlist → checksum.
 * On success returns the normalized phrase — always store/derive from that.
 */
export function validateMnemonic(input: string): MnemonicValidation {
  const words = splitMnemonic(input);
  if (words.length === 0) return { ok: false, reason: 'empty' };

  if (!(SUPPORTED_WORD_COUNTS as readonly number[]).includes(words.length)) {
    return { ok: false, reason: 'word_count', wordCount: words.length };
  }

  const unknownWords = words
    .map((word, index) => ({ index, word }))
    .filter(({ word }) => !WORDS.has(word));
  if (unknownWords.length > 0) return { ok: false, reason: 'unknown_words', unknownWords };

  const mnemonic = words.join(' ');
  if (!scureValidate(mnemonic, english)) return { ok: false, reason: 'checksum' };

  return { ok: true, mnemonic };
}

export function isBip39Word(word: string): boolean {
  return WORDS.has(word.trim().toLowerCase());
}
