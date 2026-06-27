import "server-only";

const ALLOWED_DOMAINS = new Set([
  "autolink-archive.fra1.digitaloceanspaces.com",
]);

const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20 MB

function isAllowedUrl(raw: string): boolean {
  try {
    const { protocol, hostname } = new URL(raw);
    return protocol === "https:" && ALLOWED_DOMAINS.has(hostname);
  } catch {
    return false;
  }
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return new Response("Missing url parameter", { status: 400 });
  }

  if (!isAllowedUrl(url)) {
    return new Response("Forbidden: image domain not allowed", { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, { cache: "no-store" });
  } catch {
    return new Response("Failed to fetch image from upstream", { status: 502 });
  }

  if (!upstream.ok) {
    return new Response("Upstream image not found", { status: upstream.status });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    return new Response("Forbidden: upstream response is not an image", { status: 403 });
  }

  const contentLength = Number(upstream.headers.get("content-length") ?? 0);
  if (contentLength > MAX_IMAGE_BYTES) {
    return new Response("Image too large", { status: 413 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
