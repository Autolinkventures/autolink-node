// Browser-native fetcher — zero Node.js dependencies.
// Uses window.fetch and browser AbortController only.

const _inflight = new Map<string, Promise<unknown>>();

function buildDedupKey(
  publicKey: string,
  url: URL,
): string {
  return `${publicKey}:${url.toString()}`;
}

export interface BrowserFetcherConfig {
  publicKey: string;
  baseUrl: string;
  timeout: number;
  debug: boolean;
  sdkVersion: string;
}

export class AutolinkError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly requestId: string,
  ) {
    super(message);
    this.name = "AutolinkError";
  }
}

export class AutolinkNotFoundError extends AutolinkError {
  constructor(message: string, requestId: string) {
    super(message, "NOT_FOUND", requestId);
    this.name = "AutolinkNotFoundError";
  }
}

export class AutolinkAuthError extends AutolinkError {
  constructor(message: string, requestId: string) {
    super(message, "AUTHENTICATION_ERROR", requestId);
    this.name = "AutolinkAuthError";
  }
}

export class AutolinkRateLimitError extends AutolinkError {
  readonly retryAfter: number;
  constructor(message: string, requestId: string, retryAfter: number) {
    super(message, "RATE_LIMITED", requestId);
    this.name = "AutolinkRateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class AutolinkNetworkError extends AutolinkError {
  constructor(message: string) {
    super(message, "NETWORK_ERROR", "");
    this.name = "AutolinkNetworkError";
  }
}

function throwFromResponse(
  httpStatus: number,
  body: { error: { code: string; message: string; request_id: string } },
  headers: Headers,
): never {
  const { code, message, request_id } = body.error;
  if (httpStatus === 401 || httpStatus === 403)
    throw new AutolinkAuthError(message, request_id);
  if (httpStatus === 404) throw new AutolinkNotFoundError(message, request_id);
  if (httpStatus === 429) {
    const retryAfter = parseInt(headers.get("Retry-After") ?? "60", 10);
    throw new AutolinkRateLimitError(message, request_id, retryAfter);
  }
  throw new AutolinkError(message, code ?? "GATEWAY_ERROR", request_id ?? "");
}

export async function browserFetch<T>(
  config: BrowserFetcherConfig,
  method: string,
  path: string,
  options: {
    params?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
    idempotencyKey?: string;
  } = {},
): Promise<T> {
  const url = new URL(`${config.baseUrl}${path}`);

  if (options.params) {
    // Sort keys for stable URLs — matches the core SDK's stable behaviour and
    // ensures the dedup map key is deterministic regardless of caller param order.
    const sortedKeys = Object.keys(options.params).sort();
    for (const k of sortedKeys) {
      const v = options.params[k];
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  if (method === "GET") {
    const dedupKey = buildDedupKey(config.publicKey, url);
    const existing = _inflight.get(dedupKey);
    if (existing) return existing as Promise<T>;
    const promise = _actualBrowserFetch<T>(config, method, url, options).finally(
      () => _inflight.delete(dedupKey),
    );
    _inflight.set(dedupKey, promise);
    return promise;
  }
  return _actualBrowserFetch<T>(config, method, url, options);
}

async function _actualBrowserFetch<T>(
  config: BrowserFetcherConfig,
  method: string,
  url: URL,
  options: {
    body?: unknown;
    idempotencyKey?: string;
  },
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-API-Key": config.publicKey,
      "X-Autolink-Browser-SDK-Version": config.sdkVersion,
    };
    if (options.idempotencyKey) {
      headers["Idempotency-Key"] = options.idempotencyKey;
    }

    const res = await fetch(url.toString(), {
      method,
      headers,
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (config.debug) {
      console.debug(`[autolink/browser] ${method} ${url.pathname} → ${res.status}`);
    }

    if (!res.ok) {
      const errorBody = (await res.json()) as {
        error: { code: string; message: string; request_id: string };
      };
      throwFromResponse(res.status, errorBody, res.headers);
    }

    return (await res.json()) as T;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof AutolinkError) throw err;
    throw new AutolinkNetworkError(
      `Autolink request failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
