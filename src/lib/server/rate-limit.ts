/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * Sized for a self-hosted / long-lived Node server (`next start`), matching the
 * process-wide SQLite connection model in `db.ts`. It bounds abuse of
 * cost-bearing and credential endpoints (LLM generation, checkout, auth) without
 * an external dependency. On a multi-instance deployment, swap the Map for a
 * shared store (Redis) — the call sites don't change.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets; 0 when the request is allowed. */
  retryAfterSeconds: number;
}

/**
 * Records a hit against `key` and reports whether it is within `limit` per
 * `windowMs`. The first hit in a window opens it; the window does not slide.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) pruneExpired(now);
    return { ok: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { ok: true, retryAfterSeconds: 0 };
}

function pruneExpired(now: number): void {
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}

/** Best-effort client IP from proxy headers, for limiting anonymous requests. */
export function clientIp(req: { headers: Headers }): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
