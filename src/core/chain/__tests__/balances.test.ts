import type { PublicClient } from 'viem';

import { fetchBalances } from '../balances';
import { NETWORKS, type Network } from '../networks';

const ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const USDT = '0x00000000000000000000000000000000000000aa';

function fakeClient() {
  return {
    getBalance: jest.fn(async () => 5n),
    readContract: jest.fn(async () => 7n),
  };
}

describe('fetchBalances', () => {
  it('reads POL natively and USDT via balanceOf', async () => {
    const client = fakeClient();
    const network: Network = {
      ...NETWORKS.amoy,
      tokens: [NETWORKS.amoy.tokens[0], { ...NETWORKS.amoy.tokens[1], address: USDT }],
    };
    await expect(
      fetchBalances(client as unknown as PublicClient, network, ADDRESS),
    ).resolves.toEqual({ POL: 5n, USDT: 7n });
    expect(client.getBalance).toHaveBeenCalledWith({ address: ADDRESS });
    expect(client.readContract).toHaveBeenCalledWith(
      expect.objectContaining({ address: USDT, functionName: 'balanceOf', args: [ADDRESS] }),
    );
  });

  it('skips USDT when no contract is configured', async () => {
    const client = fakeClient();
    const network: Network = {
      ...NETWORKS.amoy,
      tokens: [NETWORKS.amoy.tokens[0], { ...NETWORKS.amoy.tokens[1], address: undefined }],
    };
    await expect(
      fetchBalances(client as unknown as PublicClient, network, ADDRESS),
    ).resolves.toEqual({ POL: 5n, USDT: null });
    expect(client.readContract).not.toHaveBeenCalled();
  });
});
