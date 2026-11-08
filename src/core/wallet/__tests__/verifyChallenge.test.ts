import { createVerifyQuestions, generateMnemonic, secureRandomInt, splitMnemonic } from '..';

describe('createVerifyQuestions', () => {
  it('asks for words #3, #7 and #11 with 4 unique options and one correct answer', () => {
    for (let run = 0; run < 50; run++) {
      const words = splitMnemonic(generateMnemonic());
      const questions = createVerifyQuestions(words);

      expect(questions.map((q) => q.position)).toEqual([3, 7, 11]);
      for (const q of questions) {
        expect(q.answer).toBe(words[q.position - 1]);
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options).size).toBe(4);
        expect(q.options).toContain(q.answer);
        // Distractors never come from the phrase itself.
        const others = q.options.filter((o) => o !== q.answer);
        expect(others.some((o) => words.includes(o))).toBe(false);
      }
    }
  });
});

describe('secureRandomInt', () => {
  it('stays within range', () => {
    for (let i = 0; i < 1000; i++) {
      const value = secureRandomInt(7);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(7);
    }
  });

  it('rejects invalid bounds', () => {
    expect(() => secureRandomInt(0)).toThrow();
  });
});
