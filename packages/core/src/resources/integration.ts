import { gatewayFetch, FetcherConfig } from "../transport/fetcher.js";
import type { GatewayEnvelope, IntegrationStatus } from "../types/index.js";

export class IntegrationResource {
  constructor(private config: FetcherConfig) {}

  async check(): Promise<GatewayEnvelope<IntegrationStatus>> {
    return gatewayFetch<GatewayEnvelope<IntegrationStatus>>(
      this.config,
      "GET",
      "/integration"
    );
  }
}
