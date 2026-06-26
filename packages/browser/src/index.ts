export { AutolinkBrowserClient } from "./client.js";
export type {
  AutolinkBrowserClientOptions,
  GatewayFilterOptions,
} from "./client.js";
export { VERSION } from "./version.js";
export {
  AutolinkError,
  AutolinkAuthError,
  AutolinkNotFoundError,
  AutolinkRateLimitError,
  AutolinkNetworkError,
} from "./fetcher.js";

// Re-export types from core so consumers don't need @autolink/sdk installed separately
export type {
  AutolinkVehicle,
  AutolinkProfile,
  AutolinkArticle,
  InventoryListFilters,
  ArticleListFilters,
  GatewayEnvelope,
} from "@autolink/sdk";

import { AutolinkBrowserClient } from "./client.js";
import type { AutolinkBrowserClientOptions } from "./client.js";

/**
 * Create a browser SDK client. Pass a `gw_pub_` public key — never a server key.
 *
 * @example
 * // Via npm
 * import { init } from "@autolink/browser";
 * const client = init("gw_pub_xxx");
 * const { data } = await client.inventory.list({ make: "Toyota" });
 *
 * @example
 * // Via <script> tag
 * <script src="https://cdn.autolink.ke/browser/v1/autolink.min.js"></script>
 * <script>
 *   const client = Autolink.init("gw_pub_xxx");
 *   client.inventory.list().then(res => console.log(res.data));
 * </script>
 */
export function init(
  publicKey: string,
  options: AutolinkBrowserClientOptions = {},
): AutolinkBrowserClient {
  return new AutolinkBrowserClient(publicKey, options);
}
