import { gatewayFetch, FetcherConfig } from "../transport/fetcher.js";
import type {
  GatewayEnvelope,
  AutolinkVehicle,
  FilterOptions,
  InventoryListFilters,
} from "../types/index.js";

export class InventoryResource {
  constructor(private config: FetcherConfig) {}

  async list(
    filters: InventoryListFilters = {}
  ): Promise<GatewayEnvelope<AutolinkVehicle[]>> {
    return gatewayFetch<GatewayEnvelope<AutolinkVehicle[]>>(
      this.config,
      "GET",
      "/inventory",
      { params: filters as Record<string, string | number | boolean | undefined> }
    );
  }

  async get(slug: string): Promise<GatewayEnvelope<AutolinkVehicle>> {
    return gatewayFetch<GatewayEnvelope<AutolinkVehicle>>(
      this.config,
      "GET",
      `/inventory/${slug}`
    );
  }

  async filterOptions(): Promise<GatewayEnvelope<FilterOptions>> {
    return gatewayFetch<GatewayEnvelope<FilterOptions>>(
      this.config,
      "GET",
      "/inventory/filter-options"
    );
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
