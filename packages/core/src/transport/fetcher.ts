import { GATEWAY_URL, DEFAULT_TIMEOUT_MS, SDK_VERSION } from "./constants.js";
import {
  AutolinkAuthError,
  AutolinkForbiddenError,
  AutolinkNotFoundError,
  AutolinkValidationError,
  AutolinkRateLimitError,
  AutolinkNetworkError,
  AutolinkError,
} from "../errors.js";
import type { RetryConfig } from "./retry.js";
import { isRetryableStatus, backoffMs, sleep } from "./retry.js";

const _inflight = new Map<string, Promise<unknown>>();

function buildDedupKey(
  baseUrl: string,
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  const sortedParams = params
    ? Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${String(v)}`)
        .join("&")
    : "";
  return `${baseUrl}${path}?${sortedParams}`;
}

// Internal escape hatch for Autolink engineering only — not documented publicly.
// Silently ignored when NODE_ENV is "production".
function resolveGatewayUrl(): string {
  if (
    process.env["NODE_ENV"] !== "production" &&
    process.env["AUTOLINK_GATEWAY_URL"]
  ) {
    return `${process.env["AUTOLINK_GATEWAY_URL"]}/sdk/v1`;
  }
  return GATEWAY_URL;
}

export interface FetcherConfig {
  apiKey: string;
  timeout: number;
  retry: RetryConfig;
  debug: boolean;
}

interface GatewayErrorBody {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
    request_id: string;
  };
}

function throwFromResponse(
  status: number,
  body: GatewayErrorBody,
  headers: Headers,
): never {
  const { code, message, fields, request_id } = body.error;
  const rid = request_id ?? "";

  if (status === 401) throw new AutolinkAuthError(message, rid);
  if (status === 403) throw new AutolinkForbiddenError(message, rid);
  if (status === 404) throw new AutolinkNotFoundError(message, rid);
  if (status === 400 || status === 422)
    throw new AutolinkValidationError(message, rid, fields ?? {});
  if (status === 429) {
    const retryAfter = parseInt(headers.get("Retry-After") ?? "60", 10);
    throw new AutolinkRateLimitError(message, rid, retryAfter);
  }
  throw new AutolinkError(message, code ?? "GATEWAY_ERROR", rid);
}

async function actualFetch<T>(
  config: FetcherConfig,
  method: string,
  path: string,
  options: {
    params?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
    idempotencyKey?: string;
    signal?: AbortSignal;
  },
): Promise<T> {
  const base = resolveGatewayUrl();
  const url = new URL(`${base}${path}`);

  if (options.params) {
    for (const [k, v] of Object.entries(options.params)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-API-Key": config.apiKey,
    "X-Autolink-SDK-Version": SDK_VERSION,
  };
  if (options.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }

  const isWrite = method === "POST" || method === "PUT" || method === "PATCH";
  const maxAttempts =
    isWrite && !options.idempotencyKey ? 1 : config.retry.attempts;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await sleep(backoffMs(attempt - 1));

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      config.timeout ?? DEFAULT_TIMEOUT_MS,
    );
    const signal = options.signal ?? controller.signal;

    try {
      const res = await fetch(url.toString(), {
        method,
        headers,
        ...(options.body ? { body: JSON.stringify(options.body) } : {}),
        signal,
      });
      clearTimeout(timeoutId);

      if (config.debug) {
        const rid = res.headers.get("X-Request-ID") ?? "";
        console.debug(`[autolink] ${method} ${path} → ${res.status} (${rid})`);
      }

      if (!res.ok) {
        const errorBody = (await res.json()) as GatewayErrorBody;

        // Retry on 5xx but not on 4xx
        if (isRetryableStatus(res.status) && attempt < maxAttempts - 1) {
          lastError = new AutolinkError(
            errorBody.error?.message ?? "Gateway error",
            errorBody.error?.code ?? "GATEWAY_ERROR",
            errorBody.error?.request_id ?? "",
          );
          continue;
        }

        throwFromResponse(res.status, errorBody, res.headers);
      }

      return (await res.json()) as T;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof AutolinkError) throw err;

      const networkErr = err instanceof Error ? err : new Error(String(err));
      lastError = new AutolinkNetworkError(
        `Request to Autolink gateway failed: ${networkErr.message}`,
        networkErr,
      );

      if (attempt < maxAttempts - 1) continue;
    }
  }

  throw (
    lastError ??
    new AutolinkNetworkError("Request failed", new Error("Unknown error"))
  );
}

export async function gatewayFetch<T>(
  config: FetcherConfig,
  method: string,
  path: string,
  options: {
    params?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
    idempotencyKey?: string;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  if (method === "GET") {
    const dedupKey = buildDedupKey(resolveGatewayUrl(), path, options.params);
    const existing = _inflight.get(dedupKey);
    if (existing) return existing as Promise<T>;
    const promise = actualFetch<T>(config, method, path, options).finally(() =>
      _inflight.delete(dedupKey),
    );
    _inflight.set(dedupKey, promise);
    return promise;
  }
  return actualFetch<T>(config, method, path, options);
}
