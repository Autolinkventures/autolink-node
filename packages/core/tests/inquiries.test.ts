import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { AutolinkClient } from "../src/client.js";

const GATEWAY = "https://gateway.autolink.ke/sdk/v1";

const mockInquiry = {
  id: "inq_abc123",
  type: "vehicle",
  customer_name: "Jane Doe",
  customer_email: "jane@example.test",
  message: "Can I arrange a viewing?",
  vehicle_slug: "toyota-harrier-2022",
  lead_id: null,
  test_mode: true,
  created_at: "2024-01-01T00:00:00Z",
};

const server = setupServer(
  http.post(`${GATEWAY}/inquiries`, () =>
    HttpResponse.json({ data: mockInquiry, meta: { request_id: "req_inq" } }, { status: 201 })
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const client = new AutolinkClient({ apiKey: "gw_test_testkey123" });

describe("inquiries.create", () => {
  it("creates an inquiry and returns data", async () => {
    const result = await client.inquiries.create({
      type: "vehicle",
      customer_name: "Jane Doe",
      customer_email: "jane@example.test",
      message: "Can I arrange a viewing?",
      vehicle_slug: "toyota-harrier-2022",
    });
    expect(result.data.id).toBe("inq_abc123");
    expect(result.data.test_mode).toBe(true);
  });

  it("accepts an explicit idempotency key", async () => {
    const result = await client.inquiries.create(
      {
        type: "general",
        customer_name: "John Doe",
        customer_email: "john@example.test",
        message: "General question",
      },
      { idempotencyKey: "my-ref-123" }
    );
    expect(result.data.customer_name).toBe("Jane Doe");
  });
});
