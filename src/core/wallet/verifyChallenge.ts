import { BIP39_WORDLIST } from './mnemonic';

/** 1-based word positions the user must confirm after writing the phrase down. */
export const VERIFY_POSITIONS = [3, 7, 11] as const;
export const OPTIONS_PER_QUESTION = 4;

export type VerifyQuestion = {
  /** 1-based position in the phrase. */
  position: number;
  options: string[];
  answer: string;
};

/** Uniform integer in [0, max). Uses crypto.getRandomValues — no Math.random for anything wallet-related. */
export function secureRandomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0) throw new Error('max must be a positive integer');
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x1_0000_0000 / max) * max; // reject to avoid modulo bias
  let value: number;
  do {
    crypto.getRandomValues(buf);
    value = buf[0]!;
  } while (value >= limit);
  return value % max;
}

function shuffle<T>(items: T[], randomInt: (max: number) => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/**
 * Builds the "pick word #3, #7, #11" quiz. Distractors come from the BIP39 wordlist and
 * never include any word of the phrase, so every question has exactly one correct option.
 */
export function createVerifyQuestions(
  words: readonly string[],
  randomInt: (max: number) => number = secureRandomInt,
): VerifyQuestion[] {
  const phraseWords = new Set(words);
  return VERIFY_POSITIONS.filter((position) => position <= words.length).map((position) => {
    const answer = words[position - 1]!;
    const distractors = new Set<string>();
    while (distractors.size < OPTIONS_PER_QUESTION - 1) {
      const candidate = BIP39_WORDLIST[randomInt(BIP39_WORDLIST.length)]!;
      if (!phraseWords.has(candidate)) distractors.add(candidate);
    }
    return { position, answer, options: shuffle([answer, ...distractors], randomInt) };
  });
}
