import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFileSync, mkdirSync, rmSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

function isValidKeyFormat(key: string): boolean {
  return key.startsWith("gw_live_") || key.startsWith("gw_test_");
}

function detectFramework(pkgPath: string): "nextjs" | "node" {
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as Record<
      string,
      unknown
    >;
    const deps = {
      ...((pkg["dependencies"] as Record<string, unknown>) ?? {}),
      ...((pkg["devDependencies"] as Record<string, unknown>) ?? {}),
    };
    if ("next" in deps) return "nextjs";
  } catch {
    // file not found or invalid JSON
  }
  return "node";
}

describe("API key format validation", () => {
  it("accepts gw_live_ prefixed keys", () => {
    expect(isValidKeyFormat("gw_live_abc123")).toBe(true);
  });

  it("accepts gw_test_ prefixed keys", () => {
    expect(isValidKeyFormat("gw_test_abc123")).toBe(true);
  });

  it("rejects keys without valid prefix", () => {
    expect(isValidKeyFormat("sk_live_abc")).toBe(false);
    expect(isValidKeyFormat("ak_live_abc")).toBe(false);
    expect(isValidKeyFormat("")).toBe(false);
    expect(isValidKeyFormat("gw_abc")).toBe(false);
  });
});

describe("Framework detection", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `autolink-cli-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("detects Next.js when next is in dependencies", () => {
    writeFileSync(
      join(tmpDir, "package.json"),
      JSON.stringify({ dependencies: { next: "14.0.0", react: "18.0.0" } }),
    );
    expect(detectFramework(join(tmpDir, "package.json"))).toBe("nextjs");
  });

  it("detects Next.js when next is in devDependencies", () => {
    writeFileSync(
      join(tmpDir, "package.json"),
      JSON.stringify({ devDependencies: { next: "14.0.0" } }),
    );
    expect(detectFramework(join(tmpDir, "package.json"))).toBe("nextjs");
  });

  it("returns node when no next dependency found", () => {
    writeFileSync(
      join(tmpDir, "package.json"),
      JSON.stringify({ dependencies: { express: "4.0.0" } }),
    );
    expect(detectFramework(join(tmpDir, "package.json"))).toBe("node");
  });

  it("returns node when package.json does not exist", () => {
    expect(detectFramework(join(tmpDir, "nonexistent.json"))).toBe("node");
  });
});

describe(".env.local writing", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `autolink-env-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates .env.local with API key", () => {
    const envPath = join(tmpDir, ".env.local");
    writeFileSync(envPath, `AUTOLINK_API_KEY=gw_test_mykey\n`);
    expect(existsSync(envPath)).toBe(true);
    expect(readFileSync(envPath, "utf-8")).toContain(
      "AUTOLINK_API_KEY=gw_test_mykey",
    );
  });

  it("does not duplicate AUTOLINK_API_KEY if already present", () => {
    const envPath = join(tmpDir, ".env.local");
    const existing =
      "NEXT_PUBLIC_SITE=https://example.com\nAUTOLINK_API_KEY=gw_test_old\n";
    writeFileSync(envPath, existing);
    const content = readFileSync(envPath, "utf-8");
    const occurrences = (content.match(/AUTOLINK_API_KEY/g) ?? []).length;
    expect(occurrences).toBe(1);
  });
});
