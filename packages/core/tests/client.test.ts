import { describe, it, expect } from "vitest";
import { AutolinkClient } from "../src/client.js";

describe("AutolinkClient constructor", () => {
  it("throws when apiKey is missing", () => {
    expect(() => new AutolinkClient({ apiKey: "" })).toThrow(
      "apiKey is required",
    );
  });

  it("throws when apiKey has wrong prefix", () => {
    expect(() => new AutolinkClient({ apiKey: "ak_live_abc" })).toThrow(
      'must start with "gw_live_", "gw_test_", or "gw_pub_"',
    );
  });

  it("accepts gw_live_ prefix", () => {
    expect(
      () => new AutolinkClient({ apiKey: "gw_live_testkey123" }),
    ).not.toThrow();
  });

  it("accepts gw_test_ prefix", () => {
    expect(
      () => new AutolinkClient({ apiKey: "gw_test_testkey123" }),
    ).not.toThrow();
  });

  it("exposes expected resource namespaces", () => {
    const client = new AutolinkClient({ apiKey: "gw_test_testkey123" });
    expect(client.inventory).toBeDefined();
    expect(client.inquiries).toBeDefined();
    expect(client.profile).toBeDefined();
    expect(client.articles).toBeDefined();
    expect(client.integration).toBeDefined();
  });
});
