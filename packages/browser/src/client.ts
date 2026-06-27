import type {
  AutolinkArticle,
  AutolinkInquiryPayload,
  AutolinkProfile,
  AutolinkVehicle,
  ArticleListFilters,
  GatewayEnvelope,
  InventoryListFilters,
} from "@autolink/sdk";
import {
  browserFetch,
  AutolinkError,
  AutolinkRateLimitError,
} from "./fetcher.js";
import type { BrowserFetcherConfig } from "./fetcher.js";
import { VERSION } from "./version.js";

const GATEWAY_URL = "https://gateway.autolink.ke/sdk/v1";

export interface GatewayFilterOptions {
  makes: string[];
  models: string[];
  colours: Array<{ name: string; hex_code: string | null }>;
  body_types: Array<{ value: string; label: string }>;
  conditions: Array<{ value: string; label: string }>;
  fuel_types: Array<{ value: string; label: string }>;
  transmissions: Array<{ value: string; label: string }>;
  features: Record<string, Array<{ id: string; name: string }>>;
  year_range: { min: number | null; max: number | null };
  price_range: { min: number | null; max: number | null };
  mileage_range: { min: number; max: number | null };
}

// ── Browser memory cache ──────────────────────────────────────────────────────

class BrowserCache {
  private store = new Map<string, { value: unknown; expiresAt: number }>();

  get(key: string): unknown {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: unknown, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
}

// ── Inventory ─────────────────────────────────────────────────────────────────

class BrowserInventoryResource {
  constructor(
    private readonly config: BrowserFetcherConfig,
    private readonly cache?: BrowserCache,
    private readonly ttlMs: number = 60_000,
  ) {}

  async list(
    filters: InventoryListFilters = {},
  ): Promise<GatewayEnvelope<AutolinkVehicle[]>> {
    const key = `inventory:list:${JSON.stringify(filters)}`;
    if (this.cache) {
      const cached = this.cache.get(key);
      if (cached !== undefined)
        return cached as GatewayEnvelope<AutolinkVehicle[]>;
    }
    const result = await browserFetch<GatewayEnvelope<AutolinkVehicle[]>>(
      this.config,
      "GET",
      "/inventory",
      {
        params: filters as Record<
          string,
          string | number | boolean | undefined
        >,
      },
    );
    this.cache?.set(key, result, this.ttlMs);
    return result;
  }

  async get(slug: string): Promise<GatewayEnvelope<AutolinkVehicle>> {
    const key = `inventory:${slug}`;
    if (this.cache) {
      const cached = this.cache.get(key);
      if (cached !== undefined)
        return cached as GatewayEnvelope<AutolinkVehicle>;
    }
    const result = await browserFetch<GatewayEnvelope<AutolinkVehicle>>(
      this.config,
      "GET",
      `/inventory/${slug}`,
    );
    this.cache?.set(key, result, this.ttlMs);
    return result;
  }

  async filterOptions(): Promise<GatewayEnvelope<GatewayFilterOptions>> {
    const key = `inventory:filter-options`;
    if (this.cache) {
      const cached = this.cache.get(key);
      if (cached !== undefined)
        return cached as GatewayEnvelope<GatewayFilterOptions>;
    }
    const result = await browserFetch<GatewayEnvelope<GatewayFilterOptions>>(
      this.config,
      "GET",
      "/inventory/filter-options",
    );
    this.cache?.set(key, result, this.ttlMs);
    return result;
  }

  async similar(slug: string): Promise<GatewayEnvelope<AutolinkVehicle[]>> {
    const key = `inventory:${slug}:similar`;
    if (this.cache) {
      const cached = this.cache.get(key);
      if (cached !== undefined)
        return cached as GatewayEnvelope<AutolinkVehicle[]>;
    }
    const result = await browserFetch<GatewayEnvelope<AutolinkVehicle[]>>(
      this.config,
      "GET",
      `/inventory/${slug}/similar`,
    );
    this.cache?.set(key, result, this.ttlMs);
    return result;
  }
}

// ── Profile ───────────────────────────────────────────────────────────────────

class BrowserProfileResource {
  constructor(
    private readonly config: BrowserFetcherConfig,
    private readonly cache?: BrowserCache,
    private readonly ttlMs: number = 60_000,
  ) {}

  async get(): Promise<GatewayEnvelope<AutolinkProfile>> {
    const key = `profile`;
    if (this.cache) {
      const cached = this.cache.get(key);
      if (cached !== undefined)
        return cached as GatewayEnvelope<AutolinkProfile>;
    }
    const result = await browserFetch<GatewayEnvelope<AutolinkProfile>>(
      this.config,
      "GET",
      "/profile",
    );
    this.cache?.set(key, result, this.ttlMs);
    return result;
  }
}

// ── Articles ──────────────────────────────────────────────────────────────────

class BrowserArticlesResource {
  constructor(
    private readonly config: BrowserFetcherConfig,
    private readonly cache?: BrowserCache,
    private readonly ttlMs: number = 60_000,
  ) {}

  async list(
    filters: ArticleListFilters = {},
  ): Promise<GatewayEnvelope<AutolinkArticle[]>> {
    const key = `articles:list:${JSON.stringify(filters)}`;
    if (this.cache) {
      const cached = this.cache.get(key);
      if (cached !== undefined)
        return cached as GatewayEnvelope<AutolinkArticle[]>;
    }
    const result = await browserFetch<GatewayEnvelope<AutolinkArticle[]>>(
      this.config,
      "GET",
      "/articles",
      {
        params: filters as Record<
          string,
          string | number | boolean | undefined
        >,
      },
    );
    this.cache?.set(key, result, this.ttlMs);
    return result;
  }

  async get(slug: string): Promise<GatewayEnvelope<AutolinkArticle>> {
    const key = `articles:${slug}`;
    if (this.cache) {
      const cached = this.cache.get(key);
      if (cached !== undefined)
        return cached as GatewayEnvelope<AutolinkArticle>;
    }
    const result = await browserFetch<GatewayEnvelope<AutolinkArticle>>(
      this.config,
      "GET",
      `/articles/${slug}`,
    );
    this.cache?.set(key, result, this.ttlMs);
    return result;
  }
}

// ── Inquiries ─────────────────────────────────────────────────────────────────

type InquirySubmitPayload = Pick<
  AutolinkInquiryPayload,
  | "customer_name"
  | "customer_email"
  | "customer_phone"
  | "message"
  | "vehicle_slug"
  | "subject"
  | "type"
>;

type InquiryResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      code: string;
      requestId: string;
      retryAfter?: number;
    };

class BrowserInquiriesResource {
  constructor(private readonly config: BrowserFetcherConfig) {}

  async submit(payload: InquirySubmitPayload): Promise<InquiryResult> {
    const idempotencyKey =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const resolvedType =
      payload.type ?? (payload.vehicle_slug ? "vehicle" : "general");
    try {
      await browserFetch(this.config, "POST", "/inquiries", {
        body: { ...payload, type: resolvedType },
        idempotencyKey,
      });
      return { ok: true };
    } catch (err) {
      if (err instanceof AutolinkError) {
        return {
          ok: false,
          error: err.message,
          code: err.code,
          requestId: err.requestId,
          ...(err instanceof AutolinkRateLimitError
            ? { retryAfter: err.retryAfter }
            : {}),
        };
      }
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to submit inquiry",
        code: "NETWORK_ERROR",
        requestId: "",
      };
    }
  }
}

// ── Client ────────────────────────────────────────────────────────────────────

export interface AutolinkBrowserClientOptions {
  baseUrl?: string;
  timeout?: number;
  debug?: boolean;
  cacheTtl?: number; // seconds, default 60, set 0 to disable
}

export class AutolinkBrowserClient {
  readonly inventory: BrowserInventoryResource;
  readonly profile: BrowserProfileResource;
  readonly articles: BrowserArticlesResource;
  readonly inquiries: BrowserInquiriesResource;

  constructor(publicKey: string, options: AutolinkBrowserClientOptions = {}) {
    if (!publicKey.startsWith("gw_pub_")) {
      throw new Error(
        'AutolinkBrowserClient requires a browser key: "gw_pub_test_" for development ' +
          'or "gw_pub_" for production. ' +
          "Server keys (gw_live_/gw_test_) must never be used in the browser.",
      );
    }

    const config: BrowserFetcherConfig = {
      publicKey,
      baseUrl: options.baseUrl ?? GATEWAY_URL,
      timeout: options.timeout ?? 10_000,
      debug: options.debug ?? false,
      sdkVersion: VERSION,
    };

    const cacheTtlSeconds = options.cacheTtl ?? 60;
    const cache = cacheTtlSeconds !== 0 ? new BrowserCache() : undefined;
    const ttlMs = cacheTtlSeconds * 1000;

    this.inventory = new BrowserInventoryResource(config, cache, ttlMs);
    this.profile = new BrowserProfileResource(config, cache, ttlMs);
    this.articles = new BrowserArticlesResource(config, cache, ttlMs);
    this.inquiries = new BrowserInquiriesResource(config);
  }
}
