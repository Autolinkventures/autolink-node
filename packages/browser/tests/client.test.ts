import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { init } from "../src/index.js";

const BASE = "https://gateway.autolink.ke/sdk/v1";

const server = setupServer(
  http.get(`${BASE}/inventory`, () =>
    HttpResponse.json({
      data: [
        {
          id: "1",
          slug: "toyota-rav4",
          make: "Toyota",
          model: "RAV4",
          year: 2022,
          body_type: "SUV",
          condition: "foreign_used",
          price_kes: 3500000,
          stock_status: "available",
          published_at: "2024-01-01",
        },
      ],
      meta: {
        request_id: "r1",
        pagination: {
          total: 1,
          page: 1,
          page_size: 10,
          total_pages: 1,
          has_next: false,
          has_previous: false,
        },
      },
    }),
  ),
  http.get(`${BASE}/inventory/toyota-rav4`, () =>
    HttpResponse.json({
      data: {
        id: "1",
        slug: "toyota-rav4",
        make: "Toyota",
        model: "RAV4",
        year: 2022,
        body_type: "SUV",
        condition: "foreign_used",
        price_kes: 3500000,
        stock_status: "available",
        published_at: "2024-01-01",
      },
      meta: { request_id: "r2" },
    }),
  ),
  http.get(`${BASE}/inventory/toyota-rav4/similar`, () =>
    HttpResponse.json({
      data: [
        {
          id: "2",
          slug: "honda-crv",
          make: "Honda",
          model: "CR-V",
          year: 2022,
          body_type: "SUV",
          condition: "foreign_used",
          price_kes: 3200000,
          stock_status: "available",
          published_at: "2024-01-01",
        },
      ],
      meta: { request_id: "r7" },
    }),
  ),
  http.get(`${BASE}/inventory/filter-options`, () =>
    HttpResponse.json({
      data: {
        makes: ["Toyota", "Honda"],
        models: ["RAV4", "CR-V"],
        colours: [{ name: "White", hex_code: "#FFFFFF" }],
        body_types: [{ value: "suv", label: "SUV" }],
        conditions: [{ value: "foreign_used", label: "Foreign Used" }],
        fuel_types: [{ value: "petrol", label: "Petrol" }],
        transmissions: [{ value: "automatic", label: "Automatic" }],
        features: {},
        year_range: { min: 2018, max: 2024 },
        price_range: { min: 500000, max: 10000000 },
        mileage_range: { min: 0, max: 150000 },
      },
      meta: { request_id: "r8" },
    }),
  ),
  http.get(`${BASE}/profile`, () =>
    HttpResponse.json({
      data: {
        name: "Ann Car Sales",
        slug: "anncarsales",
        phone: "+254714380000",
      },
      meta: { request_id: "r3" },
    }),
  ),
  http.get(`${BASE}/articles`, () =>
    HttpResponse.json({
      data: [
        {
          slug: "toyota-rav4-review",
          title: "RAV4 Review",
          published_at: "2024-01-01",
          body: "",
        },
      ],
      meta: {
        request_id: "r5",
        pagination: {
          total: 1,
          page: 1,
          page_size: 10,
          total_pages: 1,
          has_next: false,
          has_previous: false,
        },
      },
    }),
  ),
  http.get(`${BASE}/articles/toyota-rav4-review`, () =>
    HttpResponse.json({
      data: {
        slug: "toyota-rav4-review",
        title: "RAV4 Review",
        published_at: "2024-01-01",
        body: "<p>Great car</p>",
        status: "published",
      },
      meta: { request_id: "r6" },
    }),
  ),
  http.post(`${BASE}/inquiries`, () =>
    HttpResponse.json(
      {
        data: { inquiry_id: "inq1", lead_id: "lead1", test_mode: false },
        meta: { request_id: "r4" },
      },
      { status: 201 },
    ),
  ),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("AutolinkBrowserClient", () => {
  it("init() rejects server keys", () => {
    expect(() => init("gw_live_xxx")).toThrow("public key");
    expect(() => init("gw_test_xxx")).toThrow("public key");
  });

  it("init() accepts gw_pub_ key", () => {
    expect(() => init("gw_pub_testkey123")).not.toThrow();
  });

  it("inventory.list() returns vehicles", async () => {
    const client = init("gw_pub_testkey123");
    const res = await client.inventory.list();
    expect(res.data).toHaveLength(1);
    expect(res.data[0]?.make).toBe("Toyota");
  });

  it("inventory.list() passes filters as query params", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE}/inventory`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ data: [], meta: { request_id: "r1" } });
      }),
    );
    const client = init("gw_pub_testkey123");
    await client.inventory.list({ make: "Toyota", price_min: 1000000 });
    const url = new URL(capturedUrl);
    expect(url.searchParams.get("make")).toBe("Toyota");
    expect(url.searchParams.get("price_min")).toBe("1000000");
  });

  it("inventory.get() returns a single vehicle", async () => {
    const client = init("gw_pub_testkey123");
    const res = await client.inventory.get("toyota-rav4");
    expect(res.data.slug).toBe("toyota-rav4");
  });

  it("inventory.similar() returns related vehicles", async () => {
    const client = init("gw_pub_testkey123");
    const res = await client.inventory.similar("toyota-rav4");
    expect(res.data).toHaveLength(1);
    expect(res.data[0]?.make).toBe("Honda");
  });

  it("inventory.filterOptions() returns typed filter options", async () => {
    const client = init("gw_pub_testkey123");
    const res = await client.inventory.filterOptions();
    expect(res.data.makes).toContain("Toyota");
    expect(res.data.price_range.min).toBe(500000);
  });

  it("profile.get() returns profile", async () => {
    const client = init("gw_pub_testkey123");
    const res = await client.profile.get();
    expect(res.data.name).toBe("Ann Car Sales");
  });

  it("articles.list() returns articles", async () => {
    const client = init("gw_pub_testkey123");
    const res = await client.articles.list();
    expect(res.data).toHaveLength(1);
    expect(res.data[0]?.slug).toBe("toyota-rav4-review");
  });

  it("articles.get() returns a single article", async () => {
    const client = init("gw_pub_testkey123");
    const res = await client.articles.get("toyota-rav4-review");
    expect(res.data.title).toBe("RAV4 Review");
  });

  it("inquiries.submit() returns ok:true on success", async () => {
    const client = init("gw_pub_testkey123");
    const res = await client.inquiries.submit({
      customer_name: "John Kamau",
      customer_email: "john@example.com",
      message: "Interested in the RAV4",
      vehicle_slug: "toyota-rav4",
    });
    expect(res.ok).toBe(true);
  });

  it("inquiries.submit() sends an Idempotency-Key header", async () => {
    let capturedKey = "";
    server.use(
      http.post(`${BASE}/inquiries`, ({ request }) => {
        capturedKey = request.headers.get("Idempotency-Key") ?? "";
        return HttpResponse.json(
          {
            data: { inquiry_id: "inq1", lead_id: null, test_mode: false },
            meta: { request_id: "r4" },
          },
          { status: 201 },
        );
      }),
    );
    const client = init("gw_pub_testkey123");
    await client.inquiries.submit({
      customer_name: "Jane",
      customer_email: "jane@example.com",
      message: "Test",
    });
    expect(capturedKey).toBeTruthy();
  });

  it("inquiries.submit() returns ok:false on error", async () => {
    server.use(
      http.post(`${BASE}/inquiries`, () =>
        HttpResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Bad input",
              request_id: "r9",
            },
          },
          { status: 400 },
        ),
      ),
    );
    const client = init("gw_pub_testkey123");
    const res = await client.inquiries.submit({
      customer_name: "X",
      customer_email: "bad",
      message: "",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBeTruthy();
  });
});
