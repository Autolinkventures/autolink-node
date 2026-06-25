"use server";
import "server-only";

import { createAutolinkClient } from "./index.js";
import { AutolinkValidationError, AutolinkAuthError } from "./index.js";

export async function submitInquiry(
  payload:
    | FormData
    | {
        type?: string;
        customer_name: string;
        customer_email: string;
        customer_phone?: string;
        subject?: string;
        message: string;
        vehicle_slug?: string;
        metadata?: Record<string, unknown>;
      },
): Promise<
  | { ok: true; data: unknown }
  | { ok: false; error: string; fields?: Record<string, string[]> }
> {
  try {
    const client = createAutolinkClient();

    let type: string | undefined;
    let customer_name: string;
    let customer_email: string;
    let customer_phone: string | undefined;
    let subject: string | undefined;
    let message: string;
    let vehicle_slug: string | undefined;
    let metadata: Record<string, unknown> | undefined;
    let idempotencyKey: string | undefined;

    if (payload instanceof FormData) {
      type = (payload.get("type") as string | null) ?? undefined;
      customer_name = (payload.get("customer_name") as string | null) ?? "";
      customer_email = (payload.get("customer_email") as string | null) ?? "";
      customer_phone =
        (payload.get("customer_phone") as string | null) ?? undefined;
      subject = (payload.get("subject") as string | null) ?? undefined;
      message = (payload.get("message") as string | null) ?? "";
      vehicle_slug =
        (payload.get("vehicle_slug") as string | null) ?? undefined;
      idempotencyKey =
        (payload.get("idempotency_key") as string | null) ?? undefined;
      const rawMetadata = payload.get("metadata");
      if (rawMetadata && typeof rawMetadata === "string") {
        try {
          metadata = JSON.parse(rawMetadata) as Record<string, unknown>;
        } catch {
          // ignore invalid JSON metadata
        }
      }
    } else {
      type = payload.type;
      customer_name = payload.customer_name;
      customer_email = payload.customer_email;
      customer_phone = payload.customer_phone;
      subject = payload.subject;
      message = payload.message;
      vehicle_slug = payload.vehicle_slug;
      metadata = payload.metadata;
    }

    const inquiryPayload = {
      type: (type ?? (vehicle_slug ? "vehicle" : "general")) as
        | "vehicle"
        | "general",
      customer_name,
      customer_email,
      ...(customer_phone ? { customer_phone } : {}),
      ...(subject ? { subject } : {}),
      message,
      ...(vehicle_slug ? { vehicle_slug } : {}),
      ...(metadata ? { metadata } : {}),
    };

    const result = await client.inquiries.create(inquiryPayload, {
      ...(idempotencyKey ? { idempotencyKey } : {}),
    });

    return { ok: true, data: result };
  } catch (err: unknown) {
    if (err instanceof AutolinkValidationError) {
      const fields: Record<string, string[]> = {};
      for (const [key, value] of Object.entries(err.fields)) {
        fields[key] = Array.isArray(value) ? value : [String(value)];
      }
      return {
        ok: false,
        error: err.message ?? "Validation failed",
        ...(Object.keys(fields).length > 0 ? { fields } : {}),
      };
    }

    if (err instanceof AutolinkAuthError) {
      return {
        ok: false,
        error: "Authentication failed. Please check your API key.",
      };
    }

    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}
