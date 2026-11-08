import { palettes } from '../tokens';

describe('theme tokens', () => {
  it('dark and light palettes define the same color keys', () => {
    expect(Object.keys(palettes.light).sort()).toEqual(Object.keys(palettes.dark).sort());
  });

  it('matches the spec colors', () => {
    expect(palettes.dark).toMatchObject({
      bg: '#0F0D14',
      surface: '#1A1724',
      surface2: '#241F33',
      text: '#F4F2F8',
      muted: '#A39DB3',
      border: '#2E2840',
      accent: '#8247E5',
      accentText: '#B794F6',
      warnBg: '#3A2A0A',
      warnText: '#FFC266',
      okBg: '#0F2E1F',
      okText: '#5FD49A',
    });
    expect(palettes.light).toMatchObject({
      bg: '#F7F5FB',
      surface: '#FFFFFF',
      surface2: '#EFEBF7',
      text: '#15121C',
      muted: '#5E5870',
      border: '#E2DCEE',
      accent: '#8247E5',
      accentText: '#6B35C9',
      warnBg: '#FFF1D6',
      warnText: '#7A4A00',
      okBg: '#DDF5E8',
      okText: '#106B3E',
    });
  });
});
