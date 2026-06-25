import { DEFAULT_TIMEOUT_MS, DEFAULT_RETRY_ATTEMPTS } from "./transport/constants.js";
import type { RetryConfig } from "./transport/retry.js";
import type { FetcherConfig } from "./transport/fetcher.js";
import { InventoryResource } from "./resources/inventory.js";
import { InquiriesResource } from "./resources/inquiries.js";
import { ProfileResource } from "./resources/profile.js";
import { ArticlesResource } from "./resources/articles.js";
import { IntegrationResource } from "./resources/integration.js";
import type { AutolinkCache } from "./cache/index.js";

export interface AutolinkClientConfig {
  apiKey: string;
  timeout?: number;
  retry?: Partial<RetryConfig>;
  debug?: boolean;
  cache?: AutolinkCache;
}

export class AutolinkClient {
  readonly inventory: InventoryResource;
  readonly inquiries: InquiriesResource;
  readonly profile: ProfileResource;
  readonly articles: ArticlesResource;
  readonly integration: IntegrationResource;

  constructor(config: AutolinkClientConfig) {
    if (!config.apiKey) {
      throw new Error("AutolinkClient: apiKey is required");
    }
    if (
      !config.apiKey.startsWith("gw_live_") &&
      !config.apiKey.startsWith("gw_test_")
    ) {
      throw new Error(
        'AutolinkClient: apiKey must start with "gw_live_" or "gw_test_"'
      );
    }

    const fetcherConfig: FetcherConfig = {
      apiKey: config.apiKey,
      timeout: config.timeout ?? DEFAULT_TIMEOUT_MS,
      retry: {
        attempts: config.retry?.attempts ?? DEFAULT_RETRY_ATTEMPTS,
        backoff: config.retry?.backoff ?? "exponential",
      },
      debug: config.debug ?? false,
    };

    this.inventory = new InventoryResource(fetcherConfig, config.cache);
    this.inquiries = new InquiriesResource(fetcherConfig);
    this.profile = new ProfileResource(fetcherConfig);
    this.articles = new ArticlesResource(fetcherConfig, config.cache);
    this.integration = new IntegrationResource(fetcherConfig);
  }
}
