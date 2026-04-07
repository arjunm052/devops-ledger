/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Suitable for single-instance deployments (Vercel serverless has one instance
 * per isolate, so this already provides per-isolate protection). For stricter
 * global rate limiting across all instances, swap this for Upstash Ratelimit
 * backed by Redis.
 */

interface RateLimitEntry {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

// Periodically evict stale entries to prevent unbounded memory growth
const CLEANUP_INTERVAL_MS = 60_000
let lastCleanup = Date.now()

function cleanup(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  const cutoff = now - windowMs
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff)
    if (entry.timestamps.length === 0) store.delete(key)
  }
}

interface RateLimitOptions {
  /** Maximum number of requests allowed within the window. */
  maxRequests: number
  /** Time window in milliseconds. */
  windowMs: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
}

export function rateLimit(
  key: string,
  { maxRequests, windowMs }: RateLimitOptions
): RateLimitResult {
  cleanup(windowMs)

  const now = Date.now()
  const cutoff = now - windowMs
  const entry = store.get(key) ?? { timestamps: [] }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff)

  if (entry.timestamps.length >= maxRequests) {
    store.set(key, entry)
    return { success: false, remaining: 0 }
  }

  entry.timestamps.push(now)
  store.set(key, entry)
  return { success: true, remaining: maxRequests - entry.timestamps.length }
}
