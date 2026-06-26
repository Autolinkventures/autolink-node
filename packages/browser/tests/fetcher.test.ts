import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { browserFetch } from "../src/fetcher.js";

const BASE = "https://gateway.autolink.ke/sdk/v1";

const server = setupServer(
  http.get(`${BASE}/inventory`, () =>
    HttpResponse.json({ data: [], meta: { request_id: "r1" } }),
  ),
  http.get(`${BASE}/fail`, () =>
    HttpResponse.json(
      { error: { code: "NOT_FOUND", message: "Not found", request_id: "r2" } },
      { status: 404 },
    ),
  ),
  http.get(
    `${BASE}/rate-limited`,
    () =>
      new HttpResponse(
        JSON.stringify({
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests",
            request_id: "r3",
          },
        }),
        { status: 429, headers: { "Retry-After": "30" } },
      ),
  ),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const config = {
  publicKey: "gw_pub_testkey",
  baseUrl: BASE,
  timeout: 5000,
  debug: false,
  sdkVersion: "0.1.0",
};

describe("browserFetch", () => {
  it("sends X-API-Key header with the public key", async () => {
    let capturedKey = "";
    server.use(
      http.get(`${BASE}/inventory`, ({ request }) => {
        capturedKey = request.headers.get("X-API-Key") ?? "";
        return HttpResponse.json({ data: [], meta: { request_id: "r1" } });
      }),
    );
    await browserFetch(config, "GET", "/inventory");
    expect(capturedKey).toBe("gw_pub_testkey");
  });

  it("sends X-Autolink-Browser-SDK-Version header", async () => {
    let capturedVersion = "";
    server.use(
      http.get(`${BASE}/inventory`, ({ request }) => {
        capturedVersion =
          request.headers.get("X-Autolink-Browser-SDK-Version") ?? "";
        return HttpResponse.json({ data: [], meta: { request_id: "r1" } });
      }),
    );
    await browserFetch(config, "GET", "/inventory");
    expect(capturedVersion).toBe("0.1.0");
  });

  it("returns parsed JSON on success", async () => {
    const result = await browserFetch(config, "GET", "/inventory");
    expect(result).toEqual({ data: [], meta: { request_id: "r1" } });
  });

  it("appends query params from options.params", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE}/inventory`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ data: [], meta: { request_id: "r1" } });
      }),
    );
    await browserFetch(config, "GET", "/inventory", {
      params: { page: 2, make: "Toyota" },
    });
    const url = new URL(capturedUrl);
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("make")).toBe("Toyota");
  });

  it("sends Idempotency-Key header when provided", async () => {
    let capturedIdempotency = "";
    server.use(
      http.post(`${BASE}/inquiries`, ({ request }) => {
        capturedIdempotency = request.headers.get("Idempotency-Key") ?? "";
        return HttpResponse.json(
          {
            data: { inquiry_id: "inq1", lead_id: null, test_mode: false },
            meta: { request_id: "r4" },
          },
          { status: 201 },
        );
      }),
    );
    await browserFetch(config, "POST", "/inquiries", {
      body: { customer_name: "John" },
      idempotencyKey: "idem-abc-123",
    });
    expect(capturedIdempotency).toBe("idem-abc-123");
  });

  it("throws AutolinkNotFoundError on 404", async () => {
    await expect(browserFetch(config, "GET", "/fail")).rejects.toMatchObject({
      name: "AutolinkNotFoundError",
      message: "Not found",
    });
  });

  it("throws AutolinkRateLimitError with retryAfter on 429", async () => {
    await expect(
      browserFetch(config, "GET", "/rate-limited"),
    ).rejects.toMatchObject({
      name: "AutolinkRateLimitError",
      retryAfter: 30,
    });
  });
});
