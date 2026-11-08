export type ApiErrorKind = 'network' | 'timeout' | 'rate_limited' | 'http' | 'bad_response';

export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** fetch + JSON with a timeout and typed errors (no secrets ever go through here). */
export async function getJson<T>(
  url: string,
  { headers, timeoutMs = 10_000 }: { headers?: Record<string, string>; timeoutMs?: number } = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { accept: 'application/json', ...headers },
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) throw new ApiError('timeout', 'Request timed out');
    throw new ApiError('network', error instanceof Error ? error.message : 'Network error');
  } finally {
    clearTimeout(timer);
  }
  if (response.status === 429) throw new ApiError('rate_limited', 'Rate limited', 429);
  if (!response.ok) throw new ApiError('http', `HTTP ${response.status}`, response.status);
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError('bad_response', 'Invalid JSON');
  }
}
