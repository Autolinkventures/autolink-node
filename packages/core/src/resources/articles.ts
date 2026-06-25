import { gatewayFetch, FetcherConfig } from "../transport/fetcher.js";
import type { GatewayEnvelope, AutolinkArticle } from "../types/index.js";
import type { AutolinkCache } from "../cache/index.js";

const TTL_ARTICLES = 600; // 10 minutes

export interface ArticleListFilters {
  page?: number;
  page_size?: number;
}

export class ArticlesResource {
  constructor(private config: FetcherConfig, private cache?: AutolinkCache) {}

  async list(
    filters: ArticleListFilters = {}
  ): Promise<GatewayEnvelope<AutolinkArticle[]>> {
    const key = `autolink:articles:list:${JSON.stringify(filters)}`;
    if (this.cache) {
      const cached = await this.cache.get(key);
      if (cached !== undefined) return cached as GatewayEnvelope<AutolinkArticle[]>;
    }
    const result = await gatewayFetch<GatewayEnvelope<AutolinkArticle[]>>(
      this.config,
      "GET",
      "/articles",
      { params: filters as Record<string, string | number | boolean | undefined> }
    );
    if (this.cache) await this.cache.set(key, result, TTL_ARTICLES);
    return result;
  }

  async get(slug: string): Promise<GatewayEnvelope<AutolinkArticle>> {
    const key = `autolink:articles:${slug}`;
    if (this.cache) {
      const cached = await this.cache.get(key);
      if (cached !== undefined) return cached as GatewayEnvelope<AutolinkArticle>;
    }
    const result = await gatewayFetch<GatewayEnvelope<AutolinkArticle>>(
      this.config,
      "GET",
      `/articles/${slug}`
    );
    if (this.cache) await this.cache.set(key, result, TTL_ARTICLES);
    return result;
  }
}
