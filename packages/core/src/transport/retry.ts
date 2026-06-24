export interface RetryConfig {
  attempts: number;
  backoff: "exponential" | "linear";
}

const RETRYABLE_STATUS = new Set([500, 502, 503, 504]);

export function isRetryableStatus(status: number): boolean {
  return RETRYABLE_STATUS.has(status);
}

export function backoffMs(attempt: number): number {
  const base = 100 * Math.pow(2, attempt);
  const jitter = Math.random() * 100;
  return Math.min(base + jitter, 10_000);
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
