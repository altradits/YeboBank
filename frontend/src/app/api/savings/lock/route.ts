import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { createLock } from "@/server/locks";
import { requireUser, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isSats } from "@/server/validate";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "savings", 30, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  const sats = body?.sats;
  const years = body?.years;
  if (!isSats(sats)) return fail(400, "Sats required");
  if (typeof years !== "number" || years < 1 || years > 10) return fail(400, "Years must be 1..10");
  const u = user as { id: string; handle: string; fullName: string };
  try {
    const lock = await mutate((db) => createLock(db, { id: u.id, handle: u.handle, name: u.fullName }, { sats, years }));
    return ok(lock);
  } catch (e) {
    return fail(400, e instanceof Error ? e.message : "Lock failed");
  }
}
