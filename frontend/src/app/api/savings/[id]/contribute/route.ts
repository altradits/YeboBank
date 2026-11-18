import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { contribute } from "@/server/locks";
import { requireUser, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isSats } from "@/server/validate";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const limited = throttle(req, "savings", 30, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  if (!isSats(body?.sats)) return fail(400, "Sats required");
  const u = user as { id: string; handle: string; fullName: string };
  try {
    const lock = await mutate((db) =>
      contribute(db, { id: u.id, handle: u.handle, name: u.fullName }, params.id, body.sats as number),
    );
    return ok(lock);
  } catch (e) {
    return fail(400, e instanceof Error ? e.message : "Contribution failed");
  }
}
