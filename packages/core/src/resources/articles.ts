import { gatewayFetch, FetcherConfig } from "../transport/fetcher.js";
import type { GatewayEnvelope, AutolinkArticle } from "../types/index.js";

export interface ArticleListFilters {
  page?: number;
  page_size?: number;
}

export class ArticlesResource {
  constructor(private config: FetcherConfig) {}

  async list(
    filters: ArticleListFilters = {}
  ): Promise<GatewayEnvelope<AutolinkArticle[]>> {
    return gatewayFetch<GatewayEnvelope<AutolinkArticle[]>>(
      this.config,
      "GET",
      "/articles",
      { params: filters as Record<string, string | number | boolean | undefined> }
    );
  }

  async get(slug: string): Promise<GatewayEnvelope<AutolinkArticle>> {
    return gatewayFetch<GatewayEnvelope<AutolinkArticle>>(
      this.config,
      "GET",
      `/articles/${slug}`
    );
  }
}
