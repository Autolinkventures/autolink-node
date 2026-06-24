import { gatewayFetch, FetcherConfig } from "../transport/fetcher.js";
import type { GatewayEnvelope, AutolinkProfile } from "../types/index.js";

export class ProfileResource {
  constructor(private config: FetcherConfig) {}

  async get(): Promise<GatewayEnvelope<AutolinkProfile>> {
    return gatewayFetch<GatewayEnvelope<AutolinkProfile>>(
      this.config,
      "GET",
      "/profile"
    );
  }
}
