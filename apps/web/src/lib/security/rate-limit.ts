import { env } from "@/lib/env";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string) {
  const now = Date.now();
  const windowMs = env.RATE_LIMIT_WINDOW_SECONDS * 1000;
  const current = buckets.get(key);

  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: env.RATE_LIMIT_MAX - 1 };
  }

  current.count += 1;
  return {
    ok: current.count <= env.RATE_LIMIT_MAX,
    remaining: Math.max(0, env.RATE_LIMIT_MAX - current.count)
  };
}

export function getClientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}
