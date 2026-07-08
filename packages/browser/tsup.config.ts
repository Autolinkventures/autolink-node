import { copyFileSync } from "fs";
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
  // tsup appends .global when globalName is set, producing autolink.iife.global.js.
  // We copy it to autolink.min.js so the CDN path matches docs.
  {
    entry: { "autolink.iife": "src/index.ts" },
    format: ["iife"],
    globalName: "Autolink",
    minify: true,
    sourcemap: false,
    target: "es2018",
    outDir: "dist",
    onSuccess: async () => {
      copyFileSync("dist/autolink.iife.global.js", "dist/autolink.min.js");
    },
  },
]);
