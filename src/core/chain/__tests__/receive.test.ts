import { NETWORKS } from '../networks';
import { receiveQrValue, receiveShareMessage, receiveWarning } from '../receive';

const ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

describe('receive helpers', () => {
  it('puts the bare checksummed address into the QR', () => {
    expect(receiveQrValue(ADDRESS.toLowerCase() as `0x${string}`)).toBe(ADDRESS);
  });

  it('shares the network and the full address', () => {
    expect(receiveShareMessage(NETWORKS.amoy, ADDRESS)).toBe(
      `My Polygon Amoy address (POL and USDT):\n${ADDRESS}`,
    );
  });

  it('adapts the network warning', () => {
    expect(receiveWarning(NETWORKS.polygon)).toBe(
      'Only send POL and Polygon tokens (like USDT) on the Polygon network. Funds sent from other networks may be lost.',
    );
    expect(receiveWarning(NETWORKS.amoy)).toContain('on the Polygon Amoy network');
  });
});
