import type { FetcherConfig } from "../transport/fetcher.js";
import { gatewayFetch } from "../transport/fetcher.js";
import type {
  GatewayEnvelope,
  AutolinkArticle,
  ArticleListFilters,
} from "../types/index.js";
import type { AutolinkCache } from "../cache/index.js";

const TTL_ARTICLES = 600; // 10 minutes

export class ArticlesResource {
  constructor(
    private config: FetcherConfig,
    private cache?: AutolinkCache,
  ) {}

  async list(
    filters: ArticleListFilters = {},
    options?: { ttl?: number },
  ): Promise<GatewayEnvelope<AutolinkArticle[]>> {
    const ttl = options?.ttl ?? TTL_ARTICLES;
    const key = `autolink:articles:list:${JSON.stringify(filters)}`;
    if (this.cache && ttl > 0) {
      const cached = await this.cache.get(key);
      if (cached !== undefined)
        return cached as GatewayEnvelope<AutolinkArticle[]>;
    }
    const result = await gatewayFetch<GatewayEnvelope<AutolinkArticle[]>>(
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
    if (this.cache && ttl > 0) await this.cache.set(key, result, ttl);
    return result;
  }

  async get(
    slug: string,
    options?: { ttl?: number },
  ): Promise<GatewayEnvelope<AutolinkArticle>> {
    const ttl = options?.ttl ?? TTL_ARTICLES;
    const key = `autolink:articles:${slug}`;
    if (this.cache && ttl > 0) {
      const cached = await this.cache.get(key);
      if (cached !== undefined)
        return cached as GatewayEnvelope<AutolinkArticle>;
    }
    const result = await gatewayFetch<GatewayEnvelope<AutolinkArticle>>(
      this.config,
      "GET",
      `/articles/${slug}`,
    );
    if (this.cache && ttl > 0) await this.cache.set(key, result, ttl);
    return result;
  }
}
