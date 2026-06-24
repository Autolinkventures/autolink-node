import "server-only";
import { AutolinkClient } from "@autolink/sdk";
export type { AutolinkClientConfig } from "@autolink/sdk";

export function createAutolinkClient(): AutolinkClient {
  const apiKey = process.env["AUTOLINK_API_KEY"];
  if (!apiKey) {
    throw new Error(
      "AutolinkClient: AUTOLINK_API_KEY environment variable is not set. " +
        "Add it to your .env.local file."
    );
  }
  return new AutolinkClient({ apiKey });
}

export { AutolinkClient } from "@autolink/sdk";
export {
  AutolinkError,
  AutolinkAuthError,
  AutolinkForbiddenError,
  AutolinkNotFoundError,
  AutolinkValidationError,
  AutolinkRateLimitError,
  AutolinkNetworkError,
} from "@autolink/sdk";
export type {
  AutolinkVehicle,
  AutolinkInquiryPayload,
  AutolinkInquiry,
  AutolinkProfile,
  AutolinkArticle,
  GatewayEnvelope,
} from "@autolink/sdk";
