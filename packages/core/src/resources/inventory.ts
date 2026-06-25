import { gatewayFetch, FetcherConfig } from "../transport/fetcher.js";
import type {
  GatewayEnvelope,
  AutolinkVehicle,
  FilterOptions,
  InventoryListFilters,
} from "../types/index.js";
import type { AutolinkCache } from "../cache/index.js";

const TTL_LIST = 300;         // 5 minutes
const TTL_SINGLE = 600;       // 10 minutes
const TTL_FILTER_OPTIONS = 300;

export class InventoryResource {
  constructor(private config: FetcherConfig, private cache?: AutolinkCache) {}

  async list(
    filters: InventoryListFilters = {}
  ): Promise<GatewayEnvelope<AutolinkVehicle[]>> {
    const key = `autolink:inventory:list:${JSON.stringify(filters)}`;
    if (this.cache) {
      const cached = await this.cache.get(key);
      if (cached !== undefined) return cached as GatewayEnvelope<AutolinkVehicle[]>;
    }
    const result = await gatewayFetch<GatewayEnvelope<AutolinkVehicle[]>>(
      this.config,
      "GET",
      "/inventory",
      { params: filters as Record<string, string | number | boolean | undefined> }
    );
    if (this.cache) await this.cache.set(key, result, TTL_LIST);
    return result;
  }

  async get(slug: string): Promise<GatewayEnvelope<AutolinkVehicle>> {
    const key = `autolink:inventory:${slug}`;
    if (this.cache) {
      const cached = await this.cache.get(key);
      if (cached !== undefined) return cached as GatewayEnvelope<AutolinkVehicle>;
    }
    const result = await gatewayFetch<GatewayEnvelope<AutolinkVehicle>>(
      this.config,
      "GET",
      `/inventory/${slug}`
    );
    if (this.cache) await this.cache.set(key, result, TTL_SINGLE);
    return result;
  }

  async filterOptions(): Promise<GatewayEnvelope<FilterOptions>> {
    const key = "autolink:inventory:filter-options";
    if (this.cache) {
      const cached = await this.cache.get(key);
      if (cached !== undefined) return cached as GatewayEnvelope<FilterOptions>;
    }
    const result = await gatewayFetch<GatewayEnvelope<FilterOptions>>(
      this.config,
      "GET",
      "/inventory/filter-options"
    );
    if (this.cache) await this.cache.set(key, result, TTL_FILTER_OPTIONS);
    return result;
  }

  async *pages(
    filters: Omit<InventoryListFilters, "page"> = {}
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
