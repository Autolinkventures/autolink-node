import { createHmac } from "crypto";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createWebhookHandler } from "../src/webhook.js";

// Mock server-only so it doesn't blow up outside Next.js
vi.mock("server-only", () => ({}));

// Mock next/cache so revalidateTag is trackable
const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({ revalidateTag }));

function sign(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

function makeRequest(body: string, headers: Record<string, string> = {}): Request {
  return new Request("https://example.com/api/autolink/revalidate", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

describe("createWebhookHandler", () => {
  beforeEach(() => {
    revalidateTag.mockClear();
  });

  it("returns 200 and revalidates inventory tag on vehicle event", async () => {
    const secret = "test-secret";
    const body = JSON.stringify({ type: "updated", resource: "vehicle" });
    const sig = sign(secret, body);

    const POST = createWebhookHandler({ secret });
    const res = await POST(makeRequest(body, { "X-Autolink-Signature": sig }));

    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("inventory");
    const json = await res.json() as { ok: boolean; revalidated: string[] };
    expect(json.ok).toBe(true);
    expect(json.revalidated).toContain("inventory");
  });

  it("returns 200 and revalidates articles tag on article event", async () => {
    const secret = "test-secret";
    const body = JSON.stringify({ type: "created", resource: "article" });

    const POST = createWebhookHandler({ secret });
    const res = await POST(
      makeRequest(body, { "X-Autolink-Signature": sign(secret, body) })
    );

    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("articles");
  });

  it("returns 200 and revalidates profile tag on profile event", async () => {
    const secret = "test-secret";
    const body = JSON.stringify({ type: "updated", resource: "profile" });

    const POST = createWebhookHandler({ secret });
    const res = await POST(
      makeRequest(body, { "X-Autolink-Signature": sign(secret, body) })
    );

    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("profile");
  });

  it("returns 401 when signature is wrong", async () => {
    const body = JSON.stringify({ type: "updated", resource: "vehicle" });
    const POST = createWebhookHandler({ secret: "correct-secret" });

    const res = await POST(
      makeRequest(body, { "X-Autolink-Signature": "deadbeef" })
    );

    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("returns 401 when signature header is missing", async () => {
    const body = JSON.stringify({ type: "updated", resource: "vehicle" });
    const POST = createWebhookHandler({ secret: "correct-secret" });

    const res = await POST(makeRequest(body));

    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("returns 400 on invalid JSON body", async () => {
    const secret = "test-secret";
    const body = "not-json";
    const POST = createWebhookHandler({ secret });

    const res = await POST(
      makeRequest(body, { "X-Autolink-Signature": sign(secret, body) })
    );

    expect(res.status).toBe(400);
  });

  it("allows requests without signature verification when no secret configured", async () => {
    const body = JSON.stringify({ type: "updated", resource: "vehicle" });
    const POST = createWebhookHandler();

    const res = await POST(makeRequest(body));

    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("inventory");
  });

  it("uses resource name as fallback tag for unknown resource types", async () => {
    const body = JSON.stringify({ type: "updated", resource: "gallery" });
    const POST = createWebhookHandler();

    const res = await POST(makeRequest(body));

    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("gallery");
  });

  it("is resistant to timing attacks — wrong-length signatures return 401", async () => {
    const body = JSON.stringify({ type: "updated", resource: "vehicle" });
    const POST = createWebhookHandler({ secret: "correct-secret" });

    // Signature that is the wrong length (not 64 hex chars)
    const res = await POST(
      makeRequest(body, { "X-Autolink-Signature": "abc" })
    );

    expect(res.status).toBe(401);
  });
});
