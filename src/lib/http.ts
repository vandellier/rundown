import { rateLimit } from "./rate-limit";

export const USER_AGENT =
  "Rundown/1.0 (personal, non-commercial news reader; links out to publishers)";

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  return ip.slice(0, 80);
}

export function tooMany(retryAfter: number): Response {
  return Response.json(
    {
      error:
        "Too many requests. This personal reader limits how often it contacts news sources.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "Cache-Control": "no-store",
      },
    },
  );
}

export function enforceLimit(
  request: Request,
  bucket: string,
  limit: number,
  windowMs: number,
): Response | null {
  const result = rateLimit(`${bucket}:${clientKey(request)}`, limit, windowMs);
  if (!result.ok) return tooMany(result.retryAfter);
  return null;
}

export function noStore(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
