import { RateLimitError } from "@filemorph/shared";

interface Bucket {
  windowStart: number;
  count: number;
}

type Mem = Record<string, Bucket>;

const g = globalThis as unknown as { __fmRateLimits?: Mem };

function mem(): Mem {
  if (!g.__fmRateLimits) g.__fmRateLimits = {};
  return g.__fmRateLimits;
}

/**
 * Minimal in-memory sliding-window rate limiter. Suitable per-instance;
 * production deployments should layer a distributed limiter (Redis) on top.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const m = mem();
  const b = m[key];
  if (!b || now - b.windowStart >= windowMs) {
    m[key] = { windowStart: now, count: 1 };
    return;
  }
  b.count += 1;
  if (b.count > limit) throw new RateLimitError("Too many requests. Please slow down.");
}

export function rateLimitKey(prefix: string, identifier: string, scope = "default"): string {
  return `${prefix}:${scope}:${identifier}`;
}
