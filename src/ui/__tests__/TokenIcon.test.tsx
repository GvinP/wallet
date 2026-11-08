import { render, screen } from '@testing-library/react-native';

import { TokenIcon } from '../TokenIcon';

describe('TokenIcon', () => {
  it('uses the spec letters: P for Polygon, T for Tether', async () => {
    await render(
      <>
        <TokenIcon symbol="POL" />
        <TokenIcon symbol="USDT" />
      </>,
    );
    expect(screen.getByText('P', { includeHiddenElements: true })).toBeOnTheScreen();
    expect(screen.getByText('T', { includeHiddenElements: true })).toBeOnTheScreen();
    expect(screen.queryByText('U', { includeHiddenElements: true })).toBeNull();
  });
});
