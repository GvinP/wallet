import { fetchNormalTxs, fetchTokenTxs, MissingApiKeyError } from '../etherscan';

const mockEnv: { etherscanKey: string | undefined } = { etherscanKey: 'TESTKEY' };
jest.mock('@/core/chain/env', () => ({
  get env() {
    return mockEnv;
  },
}));

const SELF = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const USDT = '0x00000000000000000000000000000000000000aa';

const reply = (body: unknown) =>
  jest.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  } as Response);

afterEach(() => {
  jest.restoreAllMocks();
  mockEnv.etherscanKey = 'TESTKEY';
});

describe('Etherscan V2 client', () => {
  it('requests txlist for the chain, newest first, with the key', async () => {
    const spy = reply({ status: '1', message: 'OK', result: [{ hash: '0x1' }] });
    await expect(fetchNormalTxs(80002, SELF)).resolves.toEqual([{ hash: '0x1' }]);
    const url = new URL(String(spy.mock.calls[0]![0]));
    expect(url.origin + url.pathname).toBe('https://api.etherscan.io/v2/api');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      chainid: '80002',
      module: 'account',
      action: 'txlist',
      address: SELF,
      sort: 'desc',
      apikey: 'TESTKEY',
    });
  });

  it('filters tokentx by our USDT contract', async () => {
    const spy = reply({ status: '1', message: 'OK', result: [] });
    await fetchTokenTxs(80002, SELF, USDT);
    const params = new URL(String(spy.mock.calls[0]![0])).searchParams;
    expect(params.get('action')).toBe('tokentx');
    expect(params.get('contractaddress')).toBe(USDT);
  });

  it('treats "No transactions found" as an empty list', async () => {
    reply({ status: '0', message: 'No transactions found', result: [] });
    await expect(fetchNormalTxs(80002, SELF)).resolves.toEqual([]);
  });

  it('reports an invalid key distinctly', async () => {
    reply({ status: '0', message: 'NOTOK', result: 'Missing/Invalid API Key' });
    await expect(fetchNormalTxs(80002, SELF)).rejects.toBeInstanceOf(MissingApiKeyError);
  });

  it('does not call the network without a key', async () => {
    mockEnv.etherscanKey = undefined;
    const spy = jest.spyOn(globalThis, 'fetch');
    await expect(fetchNormalTxs(80002, SELF)).rejects.toBeInstanceOf(MissingApiKeyError);
    expect(spy).not.toHaveBeenCalled();
  });

  it('reports rate limiting', async () => {
    reply({
      status: '0',
      message: 'NOTOK',
      result: 'Max calls per sec rate limit reached (3/sec)',
    });
    await expect(fetchNormalTxs(80002, SELF)).rejects.toMatchObject({ kind: 'rate_limited' });
  });
});
