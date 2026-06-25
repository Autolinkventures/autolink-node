import type { FetcherConfig } from "../transport/fetcher.js";
import { gatewayFetch } from "../transport/fetcher.js";
import type {
  GatewayEnvelope,
  AutolinkVehicle,
  FilterOptions,
  InventoryListFilters,
} from "../types/index.js";
import type { AutolinkCache } from "../cache/index.js";

const TTL_LIST = 300; // 5 minutes
const TTL_SINGLE = 600; // 10 minutes
const TTL_FILTER_OPTIONS = 300;

export class InventoryResource {
  constructor(
    private config: FetcherConfig,
    private cache?: AutolinkCache,
  ) {}

  async list(
    filters: InventoryListFilters = {},
    options?: { ttl?: number },
  ): Promise<GatewayEnvelope<AutolinkVehicle[]>> {
    const ttl = options?.ttl ?? TTL_LIST;
    const key = `autolink:inventory:list:${JSON.stringify(filters)}`;
    if (this.cache && ttl > 0) {
      const cached = await this.cache.get(key);
      if (cached !== undefined)
        return cached as GatewayEnvelope<AutolinkVehicle[]>;
    }
    const result = await gatewayFetch<GatewayEnvelope<AutolinkVehicle[]>>(
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
    if (this.cache && ttl > 0) await this.cache.set(key, result, ttl);
    return result;
  }

  async get(
    slug: string,
    options?: { ttl?: number },
  ): Promise<GatewayEnvelope<AutolinkVehicle>> {
    const ttl = options?.ttl ?? TTL_SINGLE;
    const key = `autolink:inventory:${slug}`;
    if (this.cache && ttl > 0) {
      const cached = await this.cache.get(key);
      if (cached !== undefined)
        return cached as GatewayEnvelope<AutolinkVehicle>;
    }
    const result = await gatewayFetch<GatewayEnvelope<AutolinkVehicle>>(
      this.config,
      "GET",
      `/inventory/${slug}`,
    );
    if (this.cache && ttl > 0) await this.cache.set(key, result, ttl);
    return result;
  }

  async filterOptions(options?: {
    ttl?: number;
  }): Promise<GatewayEnvelope<FilterOptions>> {
    const ttl = options?.ttl ?? TTL_FILTER_OPTIONS;
    const key = "autolink:inventory:filter-options";
    if (this.cache && ttl > 0) {
      const cached = await this.cache.get(key);
      if (cached !== undefined) return cached as GatewayEnvelope<FilterOptions>;
    }
    const result = await gatewayFetch<GatewayEnvelope<FilterOptions>>(
      this.config,
      "GET",
      "/inventory/filter-options",
    );
    if (this.cache && ttl > 0) await this.cache.set(key, result, ttl);
    return result;
  }

  async *pages(
    filters: Omit<InventoryListFilters, "page"> = {},
  ): AsyncGenerator<GatewayEnvelope<AutolinkVehicle[]>> {
    let page = 1;
    while (true) {
      const result = await this.list({ ...filters, page });
      yield result;
      const { pagination } = result.meta;
      if (!pagination || page >= pagination.pages) break;
      page++;
    }
  }
}
