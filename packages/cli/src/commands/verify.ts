import { AutolinkClient, AutolinkAuthError, AutolinkForbiddenError } from "@autolink/sdk";
import { readFileSync } from "fs";
import { join } from "path";

function loadApiKey(): string | undefined {
  try {
    const content = readFileSync(join(process.cwd(), ".env.local"), "utf-8");
    const match = content.match(/^AUTOLINK_API_KEY=(.+)$/m);
    return match?.[1]?.trim();
  } catch {
    return process.env["AUTOLINK_API_KEY"];
  }
}

export async function runVerify(): Promise<void> {
  const apiKey = loadApiKey();

  if (!apiKey) {
    console.error("✗ AUTOLINK_API_KEY not found in .env.local or environment");
    process.exit(1);
  }

  if (!apiKey.startsWith("gw_live_") && !apiKey.startsWith("gw_test_")) {
    console.error('✗ Key must start with "gw_live_" or "gw_test_"');
    process.exit(1);
  }

  console.log("Verifying connection to https://gateway.autolink.ke ...\n");

  try {
    const client = new AutolinkClient({ apiKey, timeout: 8_000 });
    const { data } = await client.integration.check();

    console.log(`✓ Key valid`);
    console.log(`  Environment : ${data.environment}`);
    console.log(`  Tenant      : ${data.tenant.name} (${data.tenant.slug})`);
    console.log(`  Scopes      : ${data.scopes.join(", ")}`);
    console.log(`  API version : ${data.api_version}`);
    console.log(`  Gateway     : https://gateway.autolink.ke`);
  } catch (err) {
    if (err instanceof AutolinkAuthError) {
      console.error("✗ Authentication failed — check your AUTOLINK_API_KEY");
    } else if (err instanceof AutolinkForbiddenError) {
      console.error("✗ Key lacks required scopes");
    } else {
      console.error(`✗ Gateway unreachable: ${(err as Error).message}`);
    }
    process.exit(1);
  }
}
