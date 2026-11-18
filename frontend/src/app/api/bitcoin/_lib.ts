// Shared helpers for the bitcoin API routes: error mapping, JSON responses,
// and a tiny in-memory rate limiter for money-moving endpoints.

import { NextResponse } from "next/server";
import { isBitcoinError } from "@/server/bitcoin/types";

export function err(code: string, message: string, status = 400): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function toErrorResponse(e: unknown): NextResponse {
  if (isBitcoinError(e)) return err(e.code, e.message, e.status);
  const message = e instanceof Error ? e.message : "Unexpected error";
  console.error("[bitcoin-api]", message);
  return err("INTERNAL_ERROR", "Bitcoin service temporarily unavailable", 500);
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = (await req.json()) as unknown;
    if (body === null || typeof body !== "object" || Array.isArray(body)) return {};
    return body as Record<string, unknown>;
  } catch {
    return {};
  }
}

// --- Minimal per-IP rate limiter (in-memory; use Redis in multi-instance prod) ---
// Shared across ALL routes via globalThis (per-route module copies would let
// each route run its own limit). See server/store.ts for why.
const hits: Map<string, { count: number; resetAt: number }> = (() => {
  const g = globalThis as unknown as { __yeboBtcHits?: Map<string, { count: number; resetAt: number }> };
  if (!g.__yeboBtcHits) g.__yeboBtcHits = new Map();
  return g.__yeboBtcHits;
})();

export function rateLimit(req: Request, key: string, max = 30, windowMs = 60_000): boolean {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const k = `${key}:${ip}`;
  const now = Date.now();
  const cur = hits.get(k);
  if (!cur || now >= cur.resetAt) {
    hits.set(k, { count: 1, resetAt: now + windowMs });
    return true;
  }
  cur.count += 1;
  return cur.count <= max;
}

export function rateLimited(): NextResponse {
  return err("RATE_LIMITED", "Too many requests — slow down and retry in a minute", 429);
}

export function idempotencyKey(req: Request, body: Record<string, unknown>): string | undefined {
  const h = req.headers.get("idempotency-key")?.trim();
  if (h) return h.slice(0, 128);
  const b = body.idempotencyKey;
  return typeof b === "string" && b.trim() ? b.trim().slice(0, 128) : undefined;
}
