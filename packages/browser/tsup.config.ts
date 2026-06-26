import { defineConfig } from "tsup";

export default defineConfig([
  // ESM + CJS for npm consumers
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    target: "es2020",
  },
  // IIFE for <script> tag usage — exposes window.Autolink
  {
    entry: { "autolink.iife": "src/index.ts" },
    format: ["iife"],
    globalName: "Autolink",
    minify: true,
    sourcemap: false,
    target: "es2018",
    outDir: "dist",
  },
]);
