import { generateMnemonic, normalizeMnemonic, splitMnemonic, validateMnemonic } from '..';

const VALID_12 = 'test test test test test test test test test test test junk';

describe('generateMnemonic', () => {
  it('creates a valid 12-word phrase by default', () => {
    const mnemonic = generateMnemonic();
    expect(splitMnemonic(mnemonic)).toHaveLength(12);
    expect(validateMnemonic(mnemonic).ok).toBe(true);
  });

  it('creates a valid 24-word phrase', () => {
    const mnemonic = generateMnemonic(24);
    expect(splitMnemonic(mnemonic)).toHaveLength(24);
    expect(validateMnemonic(mnemonic).ok).toBe(true);
  });

  it('does not repeat', () => {
    expect(generateMnemonic()).not.toBe(generateMnemonic());
  });
});

describe('normalizeMnemonic', () => {
  it('trims, lower-cases and collapses whitespace from pasted text', () => {
    expect(normalizeMnemonic('  Test\ttest\n\nTEST  junk ')).toBe('test test test junk');
  });
});

describe('validateMnemonic', () => {
  it('accepts a valid phrase and returns it normalized', () => {
    expect(validateMnemonic(`  ${VALID_12.toUpperCase()}\n`)).toEqual({
      ok: true,
      mnemonic: VALID_12,
    });
  });

  it('rejects empty input', () => {
    expect(validateMnemonic('   ')).toEqual({ ok: false, reason: 'empty' });
  });

  it('rejects unsupported word counts', () => {
    expect(validateMnemonic('test test test')).toEqual({
      ok: false,
      reason: 'word_count',
      wordCount: 3,
    });
  });

  it('reports which words are not in the BIP39 list', () => {
    const phrase = VALID_12.replace(/^test/, 'tset').replace(/junk$/, 'junkk');
    expect(validateMnemonic(phrase)).toEqual({
      ok: false,
      reason: 'unknown_words',
      unknownWords: [
        { index: 0, word: 'tset' },
        { index: 11, word: 'junkk' },
      ],
    });
  });

  it('rejects a bad checksum', () => {
    expect(validateMnemonic(VALID_12.replace(/junk$/, 'test'))).toEqual({
      ok: false,
      reason: 'checksum',
    });
  });
});
