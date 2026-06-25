import { gatewayFetch, FetcherConfig } from "../transport/fetcher.js";
import type {
  GatewayEnvelope,
  AutolinkInquiry,
  AutolinkInquiryPayload,
} from "../types/index.js";
import { randomUUID } from "crypto";

export interface InquiryCreateOptions {
  idempotencyKey?: string;
}

export class InquiriesResource {
  constructor(private config: FetcherConfig) {}

  async create(
    payload: AutolinkInquiryPayload,
    options: InquiryCreateOptions = {},
  ): Promise<GatewayEnvelope<AutolinkInquiry>> {
    const idempotencyKey = options.idempotencyKey ?? randomUUID();
    return gatewayFetch<GatewayEnvelope<AutolinkInquiry>>(
      this.config,
      "POST",
      "/inquiries",
      { body: payload, idempotencyKey },
    );
  }
}
