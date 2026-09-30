type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): { ok: boolean; retryAfter: number; remaining: number } {
  if (buckets.size > 5000) {
    for (const [name, bucket] of buckets) {
      if (bucket.reset < now) buckets.delete(name);
    }
  }
  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.reset) {
    bucket = { count: 0, reset: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((bucket.reset - now) / 1000)),
      remaining: 0,
    };
  }
  return { ok: true, retryAfter: 0, remaining: limit - bucket.count };
}

export function resetRateLimits(): void {
  buckets.clear();
}
