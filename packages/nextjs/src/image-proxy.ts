import "server-only";

const ALLOWED_DOMAINS = [
  "autolink-archive.fra1.digitaloceanspaces.com",
  "autolink-archive.fra1.digitaloceanspaces.com",
];

function isAllowedUrl(raw: string): boolean {
  try {
    const { hostname } = new URL(raw);
    return (
      ALLOWED_DOMAINS.includes(hostname) ||
      hostname.endsWith(".digitaloceanspaces.com")
    );
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
    return new Response("Upstream image not found", {
      status: upstream.status,
    });
  }

  const contentType = upstream.headers.get("content-type") ?? "image/jpeg";

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
