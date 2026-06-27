import type {
  AutolinkArticle,
  AutolinkInquiryPayload,
  AutolinkProfile,
  AutolinkVehicle,
  ArticleListFilters,
  GatewayEnvelope,
  InventoryListFilters,
} from "@autolink/sdk";
import { browserFetch } from "./fetcher.js";
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

// ── Inventory ─────────────────────────────────────────────────────────────────

class BrowserInventoryResource {
  constructor(private readonly config: BrowserFetcherConfig) {}

  list(
    filters: InventoryListFilters = {},
  ): Promise<GatewayEnvelope<AutolinkVehicle[]>> {
    return browserFetch<GatewayEnvelope<AutolinkVehicle[]>>(
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
  }

  get(slug: string): Promise<GatewayEnvelope<AutolinkVehicle>> {
    return browserFetch<GatewayEnvelope<AutolinkVehicle>>(
      this.config,
      "GET",
      `/inventory/${slug}`,
    );
  }

  filterOptions(): Promise<GatewayEnvelope<GatewayFilterOptions>> {
    return browserFetch<GatewayEnvelope<GatewayFilterOptions>>(
      this.config,
      "GET",
      "/inventory/filter-options",
    );
  }

  similar(slug: string): Promise<GatewayEnvelope<AutolinkVehicle[]>> {
    return browserFetch<GatewayEnvelope<AutolinkVehicle[]>>(
      this.config,
      "GET",
      `/inventory/${slug}/similar`,
    );
  }
}

// ── Profile ───────────────────────────────────────────────────────────────────

class BrowserProfileResource {
  constructor(private readonly config: BrowserFetcherConfig) {}

  get(): Promise<GatewayEnvelope<AutolinkProfile>> {
    return browserFetch<GatewayEnvelope<AutolinkProfile>>(
      this.config,
      "GET",
      "/profile",
    );
  }
}

// ── Articles ──────────────────────────────────────────────────────────────────

class BrowserArticlesResource {
  constructor(private readonly config: BrowserFetcherConfig) {}

  list(
    filters: ArticleListFilters = {},
  ): Promise<GatewayEnvelope<AutolinkArticle[]>> {
    return browserFetch<GatewayEnvelope<AutolinkArticle[]>>(
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
  }

  get(slug: string): Promise<GatewayEnvelope<AutolinkArticle>> {
    return browserFetch<GatewayEnvelope<AutolinkArticle>>(
      this.config,
      "GET",
      `/articles/${slug}`,
    );
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

type InquiryResult = { ok: true } | { ok: false; error: string };

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
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to submit inquiry",
      };
    }
  }
}

// ── Client ────────────────────────────────────────────────────────────────────

export interface AutolinkBrowserClientOptions {
  baseUrl?: string;
  timeout?: number;
  debug?: boolean;
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

    this.inventory = new BrowserInventoryResource(config);
    this.profile = new BrowserProfileResource(config);
    this.articles = new BrowserArticlesResource(config);
    this.inquiries = new BrowserInquiriesResource(config);
  }
}
