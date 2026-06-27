import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

interface WebhookHandlerConfig {
  secret?: string;
  /** Set to true to bypass signature verification. Only safe in local development. */
  skipVerification?: boolean;
}

type RevalidateTag = (tag: string) => void;

const RESOURCE_TAGS: Record<string, string[]> = {
  vehicle: ["inventory"],
  article: ["articles"],
  profile: ["profile"],
};

function verifySignature(
  secret: string,
  payload: string,
  signature: string,
): boolean {
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex"),
    );
  } catch {
    return false;
  }
}

export function createWebhookHandler(config: WebhookHandlerConfig = {}) {
  return async function POST(request: Request): Promise<Response> {
    const body = await request.text();

    if (!config.skipVerification && config.secret) {
      const sig = request.headers.get("X-Autolink-Signature") ?? "";
      if (!verifySignature(config.secret!, body, sig)) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    let event: { type?: string; resource?: string };
    try {
      event = JSON.parse(body) as { type?: string; resource?: string };
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resource = event.resource ?? "";
    const tags = RESOURCE_TAGS[resource] ?? [resource];

    // Dynamically import next/cache to avoid breaking non-Next.js environments
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — next/cache is a peer dep, not available at build time
      const { revalidateTag } = (await import("next/cache")) as {
        revalidateTag: RevalidateTag;
      };
      for (const tag of tags) {
        revalidateTag(tag);
      }
    } catch {
      // Not in a Next.js context — skip revalidation
    }

    return new Response(JSON.stringify({ ok: true, revalidated: tags }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.AUTOLINK_WEBHOOK_SECRET;
  if (!secret) {
    return new Response(
      JSON.stringify({ error: "AUTOLINK_WEBHOOK_SECRET is not configured." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
  return createWebhookHandler({ secret })(request);
}
