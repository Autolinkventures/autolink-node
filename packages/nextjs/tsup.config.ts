import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    target: "node20",
  },
  {
    entry: ["src/actions.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    target: "node20",
  },
  {
    entry: ["src/webhook.ts"],
    format: ["esm", "cjs"],
    dts: false,
    sourcemap: true,
    target: "node20",
    async onSuccess() {
      const { copyFileSync } = await import("fs");
      copyFileSync("src/webhook.d.ts", "dist/webhook.d.ts");
      copyFileSync("src/webhook.d.ts", "dist/webhook.d.mts");
    },
  },
]);
