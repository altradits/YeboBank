// In-memory token-bucket rate limiter (per key). Demo scope: a single
// server process. Tests reset it via `resetForTests`.

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

function prune(now: number, windowMs: number, bucket: Bucket): void {
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
}

/** Returns true when the call is allowed (and records it). */
export function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { hits: [] };
    buckets.set(key, bucket);
  }
  prune(now, windowMs, bucket);
  if (bucket.hits.length >= limit) return false;
  bucket.hits.push(now);
  return true;
}

export function resetForTests(): void {
  buckets.clear();
}
