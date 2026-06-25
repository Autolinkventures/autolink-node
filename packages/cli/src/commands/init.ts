import { AutolinkClient, AutolinkAuthError } from "@autolink/sdk";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { createInterface } from "readline";

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function detectFramework(): "nextjs" | "node" {
  try {
    const pkg = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf-8"),
    ) as Record<string, unknown>;
    const deps = {
      ...((pkg["dependencies"] as Record<string, unknown>) ?? {}),
      ...((pkg["devDependencies"] as Record<string, unknown>) ?? {}),
    };
    if ("next" in deps) return "nextjs";
  } catch {}
  return "node";
}

const AUTOLINK_CLIENT_TEMPLATE = `import { createAutolinkClient } from "@autolink/nextjs";

export const autolink = createAutolinkClient();
`;

const WEBHOOK_TEMPLATE = `import { createWebhookHandler } from "@autolink/nextjs/webhook";

export const POST = createWebhookHandler({
  secret: process.env.AUTOLINK_WEBHOOK_SECRET,
});
`;

const NODE_CLIENT_TEMPLATE = `import { AutolinkClient } from "@autolink/sdk";

export const autolink = new AutolinkClient({
  apiKey: process.env.AUTOLINK_API_KEY,
});
`;

export async function runInit(): Promise<void> {
  console.log("Autolink SDK setup\n");

  const apiKey = await prompt(
    "Enter your Autolink API key (gw_live_… or gw_test_…): ",
  );

  if (!apiKey.startsWith("gw_live_") && !apiKey.startsWith("gw_test_")) {
    console.error(
      '\n✗ Invalid key format. Key must start with "gw_live_" or "gw_test_"',
    );
    process.exit(1);
  }

  console.log("\nVerifying key against gateway...");
  try {
    const client = new AutolinkClient({ apiKey, timeout: 8_000 });
    const { data } = await client.integration.check();
    console.log(
      `✓ Connected — tenant: ${data.tenant.name} (${data.environment})\n`,
    );
  } catch (err) {
    if (err instanceof AutolinkAuthError) {
      console.error(
        "✗ Key is invalid or revoked. Check your Autolink dashboard.",
      );
    } else {
      console.error(`✗ Could not reach gateway: ${(err as Error).message}`);
    }
    process.exit(1);
  }

  // Write .env.local
  const envPath = join(process.cwd(), ".env.local");
  const envLine = `AUTOLINK_API_KEY=${apiKey}\n`;
  if (existsSync(envPath)) {
    const existing = readFileSync(envPath, "utf-8");
    if (!existing.includes("AUTOLINK_API_KEY")) {
      writeFileSync(envPath, existing + envLine);
    }
  } else {
    writeFileSync(envPath, envLine);
  }
  console.log("✓ Written .env.local");

  const framework = detectFramework();

  if (framework === "nextjs") {
    const libDir = join(process.cwd(), "lib");
    if (!existsSync(libDir)) {
      const { mkdirSync } = await import("fs");
      mkdirSync(libDir, { recursive: true });
    }
    writeFileSync(join(libDir, "autolink.ts"), AUTOLINK_CLIENT_TEMPLATE);
    console.log("✓ Written lib/autolink.ts");

    writeFileSync(join(libDir, "autolink-webhook.ts"), WEBHOOK_TEMPLATE);
    console.log("✓ Written lib/autolink-webhook.ts");

    console.log(`
Next steps:
  1. Install packages:  npm install @autolink/sdk @autolink/nextjs
  2. In a Server Component:
       import { autolink } from "@/lib/autolink"
       const { data } = await autolink.inventory.list()
  3. Webhook (optional): mount lib/autolink-webhook.ts at app/api/autolink/revalidate/route.ts
  4. Docs: https://developers.autolink.ke
`);
  } else {
    writeFileSync(join(process.cwd(), "autolink.ts"), NODE_CLIENT_TEMPLATE);
    console.log("✓ Written autolink.ts");
    console.log(`
Next steps:
  1. Install package:  npm install @autolink/sdk
  2. Import and use:
       import { autolink } from "./autolink"
       const { data } = await autolink.inventory.list()
  3. Docs: https://developers.autolink.ke
`);
  }
}
