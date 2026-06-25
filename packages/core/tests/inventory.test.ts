import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { AutolinkClient } from "../src/client.js";
import {
  AutolinkAuthError,
  AutolinkNotFoundError,
  AutolinkRateLimitError,
  AutolinkValidationError,
  AutolinkForbiddenError,
} from "../src/errors.js";

const GATEWAY = "https://gateway.autolink.ke/sdk/v1";

const mockVehicle = {
  slug: "toyota-harrier-2022",
  title: "2022 Toyota Harrier",
  make: "Toyota",
  model: "Harrier",
  year: 2022,
  price_kes: 4500000,
  condition: "used",
  photos: [{ url: "https://cdn.example.com/car.jpg", is_primary: true }],
  listing_status: "published",
  stock_status: "available",
  published_at: "2024-01-01T00:00:00Z",
};

const server = setupServer(
  http.get(`${GATEWAY}/inventory`, () =>
    HttpResponse.json({
      data: [mockVehicle],
      meta: {
        request_id: "req_test",
        pagination: { total: 1, page: 1, page_size: 20, pages: 1 },
      },
    }),
  ),

  http.get(`${GATEWAY}/inventory/toyota-harrier-2022`, () =>
    HttpResponse.json({ data: mockVehicle, meta: { request_id: "req_test" } }),
  ),

  http.get(`${GATEWAY}/inventory/not-found`, () =>
    HttpResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Vehicle not found",
          request_id: "req_404",
        },
      },
      { status: 404 },
    ),
  ),

  http.get(`${GATEWAY}/inventory/filter-options`, () =>
    HttpResponse.json({
      data: {
        makes: ["Toyota", "Nissan"],
        models: ["Harrier", "X-Trail"],
        years: [2022, 2021],
        conditions: ["used", "new"],
        transmissions: ["automatic"],
        fuel_types: ["petrol"],
        body_types: ["suv"],
        price_range: { min: 500000, max: 10000000 },
      },
      meta: { request_id: "req_test" },
    }),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const client = new AutolinkClient({ apiKey: "gw_test_testkey123" });

describe("inventory.list", () => {
  it("returns paginated vehicle list", async () => {
    const result = await client.inventory.list();
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.slug).toBe("toyota-harrier-2022");
    expect(result.meta.pagination?.total).toBe(1);
  });
});

describe("inventory.get", () => {
  it("returns single vehicle", async () => {
    const result = await client.inventory.get("toyota-harrier-2022");
    expect(result.data.slug).toBe("toyota-harrier-2022");
    expect(result.data.make).toBe("Toyota");
  });

  it("throws AutolinkNotFoundError for missing slug", async () => {
    await expect(client.inventory.get("not-found")).rejects.toBeInstanceOf(
      AutolinkNotFoundError,
    );
  });
});

describe("inventory.filterOptions", () => {
  it("returns filter option arrays", async () => {
    const result = await client.inventory.filterOptions();
    expect(result.data.makes).toContain("Toyota");
    expect(result.data.price_range.min).toBe(500000);
  });
});

describe("error types", () => {
  it("throws AutolinkAuthError on 401", async () => {
    server.use(
      http.get(`${GATEWAY}/inventory`, () =>
        HttpResponse.json(
          {
            error: {
              code: "AUTHENTICATION_ERROR",
              message: "Invalid key",
              request_id: "req_401",
            },
          },
          { status: 401 },
        ),
      ),
    );
    await expect(client.inventory.list()).rejects.toBeInstanceOf(
      AutolinkAuthError,
    );
  });

  it("throws AutolinkForbiddenError on 403", async () => {
    server.use(
      http.get(`${GATEWAY}/inventory`, () =>
        HttpResponse.json(
          {
            error: {
              code: "FORBIDDEN",
              message: "Missing scope",
              request_id: "req_403",
            },
          },
          { status: 403 },
        ),
      ),
    );
    await expect(client.inventory.list()).rejects.toBeInstanceOf(
      AutolinkForbiddenError,
    );
  });

  it("throws AutolinkRateLimitError on 429", async () => {
    server.use(
      http.get(`${GATEWAY}/inventory`, () =>
        HttpResponse.json(
          {
            error: {
              code: "RATE_LIMITED",
              message: "Too many requests",
              request_id: "req_429",
            },
          },
          { status: 429 },
        ),
      ),
    );
    const err = await client.inventory.list().catch((e) => e);
    expect(err).toBeInstanceOf(AutolinkRateLimitError);
  });

  it("throws AutolinkValidationError on 400 and exposes fields", async () => {
    server.use(
      http.get(`${GATEWAY}/inventory`, () =>
        HttpResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Bad input",
              fields: { feature_ids: ["Not a valid UUID"] },
              request_id: "req_400",
            },
          },
          { status: 400 },
        ),
      ),
    );
    const err = await client.inventory.list().catch((e) => e);
    expect(err).toBeInstanceOf(AutolinkValidationError);
    expect(err.fields.feature_ids).toContain("Not a valid UUID");
  });
});
