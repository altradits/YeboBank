// Shared helpers for /api route handlers: JSON responses, session auth,
// CSRF checks, and per-IP rate limiting.

import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE, getSessionUser, getSessionCsrf, ensureSeeded, type PublicUser, toPublic,
} from "./auth";
import { allow } from "./rate";
import type { StoredUser } from "./store";

export function ok<T>(data: T, headers?: HeadersInit): NextResponse<T> {
  return NextResponse.json(data, { headers });
}

export function fail(status: number, message: string): NextResponse<{ error: string }> {
  return NextResponse.json({ error: message }, { status });
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    (req as unknown as { ip?: string }).ip ||
    "local"
  );
}

/** Per-IP throttle. Returns a 429 response when over the limit. */
export function throttle(req: NextRequest, scope: string, limit: number, windowMs: number): NextResponse | null {
  if (!allow(`${scope}:${clientIp(req)}`, limit, windowMs)) {
    return fail(429, "Too many requests, slow down");
  }
  return null;
}

export async function currentUser(req: NextRequest): Promise<StoredUser | null> {
  await ensureSeeded();
  return getSessionUser(req.cookies.get(SESSION_COOKIE)?.value);
}

export async function requireUser(req: NextRequest): Promise<StoredUser | NextResponse> {
  const user = await currentUser(req);
  if (!user) return fail(401, "Not signed in");
  return user;
}

/** CSRF double-check for state-changing routes. */
export function requireCsrf(req: NextRequest): NextResponse | null {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const expected = getSessionCsrf(token);
  const sent = req.headers.get("x-csrf-token");
  if (!expected || !sent || sent !== expected) return fail(403, "Bad CSRF token");
  return null;
}

export function publicUser(u: StoredUser): PublicUser {
  return toPublic(u);
}

export async function requireMlinzi(req: NextRequest): Promise<StoredUser | NextResponse> {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "mlinzi") return fail(403, "Mlinzi only");
  return user;
}

export async function requireAgent(req: NextRequest): Promise<StoredUser | NextResponse> {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!user.isAgent) return fail(403, "Agents only");
  return user;
}

export async function readJson(req: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body = (await req.json()) as unknown;
    if (body && typeof body === "object" && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}
