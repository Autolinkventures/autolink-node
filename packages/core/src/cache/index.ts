export interface AutolinkCache {
  get(key: string): Promise<unknown> | unknown;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void> | void;
  delete(key: string): Promise<void> | void;
}

interface CacheEntry {
  value: unknown;
  expiresAt: number | null; // null = no expiry
}

const MAX_ENTRIES = 200;

export class MemoryCache implements AutolinkCache {
  private store = new Map<string, CacheEntry>();

  get(key: string): unknown {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: unknown, ttlSeconds?: number): void {
    // Evict oldest entry if at capacity and key is new
    if (this.store.size >= MAX_ENTRIES && !this.store.has(key)) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds != null ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  /** Remove all expired entries. Optional maintenance call. */
  purgeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}
