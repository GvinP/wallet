import { SensitiveGrants } from '../SensitiveGrants';

describe('SensitiveGrants', () => {
  it('nothing is allowed without a grant', () => {
    expect(new SensitiveGrants().consume('revealPhrase')).toBe(false);
  });

  it('a grant works exactly once', () => {
    const g = new SensitiveGrants(() => 0);
    g.grant('revealPhrase');
    expect(g.consume('revealPhrase')).toBe(true);
    expect(g.consume('revealPhrase')).toBe(false);
  });

  it('grants are per action', () => {
    const g = new SensitiveGrants(() => 0);
    g.grant('revealPhrase');
    expect(g.consume('deleteWallet')).toBe(false);
    expect(g.consume('revealPhrase')).toBe(true);
  });

  it('expires after 30 s', () => {
    let now = 0;
    const g = new SensitiveGrants(() => now);
    g.grant('deleteWallet');
    now = 30_001;
    expect(g.consume('deleteWallet')).toBe(false);
  });

  it('clear() drops everything', () => {
    const g = new SensitiveGrants(() => 0);
    g.grant('deleteWallet');
    g.clear();
    expect(g.consume('deleteWallet')).toBe(false);
  });
});
