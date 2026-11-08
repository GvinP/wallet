import { ApiError } from '../http';
import { fetchPrices } from '../prices';

const mockFetch = (status: number, body: unknown) =>
  jest.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);

afterEach(() => jest.restoreAllMocks());

describe('fetchPrices', () => {
  it('requests both CoinGecko ids and maps them to symbols', async () => {
    const spy = mockFetch(200, { 'polygon-ecosystem-token': { usd: 0.4 }, tether: { usd: 1 } });
    await expect(fetchPrices()).resolves.toEqual({ POL: 0.4, USDT: 1 });
    expect(String(spy.mock.calls[0]![0])).toContain(
      'ids=polygon-ecosystem-token,tether&vs_currencies=usd',
    );
  });

  it('returns null for a missing price instead of failing', async () => {
    mockFetch(200, { tether: { usd: 1 } });
    await expect(fetchPrices()).resolves.toEqual({ POL: null, USDT: 1 });
  });

  it('turns 429 into a typed rate-limit error', async () => {
    mockFetch(429, {});
    await expect(fetchPrices()).rejects.toMatchObject({ kind: 'rate_limited' });
  });

  it('turns network failures into ApiError', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network request failed'));
    await expect(fetchPrices()).rejects.toBeInstanceOf(ApiError);
  });
});
