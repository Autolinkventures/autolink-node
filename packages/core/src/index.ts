export { AutolinkClient } from "./client.js";
export type { AutolinkClientConfig } from "./client.js";

export {
  AutolinkError,
  AutolinkAuthError,
  AutolinkForbiddenError,
  AutolinkNotFoundError,
  AutolinkValidationError,
  AutolinkRateLimitError,
  AutolinkNetworkError,
} from "./errors.js";

export type {
  GatewayEnvelope,
  GatewayMeta,
  GatewayPagination,
  AutolinkVehicle,
  VehiclePhoto,
  VehicleDealer,
  CoverImageVariants,
  InventoryListFilters,
  FilterOptions,
  AutolinkInquiryPayload,
  AutolinkInquiry,
  AutolinkProfile,
  AutolinkArticle,
  ArticleListFilters,
  IntegrationStatus,
  StockStatus,
  VehicleCondition,
} from "./types/index.js";

// ---------------------------------------------------------------------------
// DX helpers
// ---------------------------------------------------------------------------

import type { GatewayEnvelope } from "./types/index.js";
import type { AutolinkValidationError } from "./errors.js";

/** Unwraps a GatewayEnvelope and returns the data directly */
export function unwrap<T>(envelope: GatewayEnvelope<T>): T {
  return envelope.data;
}

/** Returns field-level validation errors for a given field name */
export function getFieldErrors(
  error: AutolinkValidationError,
  field: string,
): string[] {
  return error.fields[field] ?? [];
}

export {
  GATEWAY_BASE_URL,
  GATEWAY_URL,
  SDK_VERSION,
} from "./transport/constants.js";

export type { AutolinkCache } from "./cache/index.js";
export { MemoryCache } from "./cache/index.js";
