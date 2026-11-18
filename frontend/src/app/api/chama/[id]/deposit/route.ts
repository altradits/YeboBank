import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { deposit } from "@/server/chamas";
import { requireUser, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isSats } from "@/server/validate";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const limited = throttle(req, "chama", 30, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  if (!isSats(body?.sats)) return fail(400, "Sats required");
  const u = user as { id: string; handle: string; fullName: string };
  try {
    await mutate((db) => deposit(db, { id: u.id, handle: u.handle, name: u.fullName }, params.id, body.sats as number));
    return ok({ ok: true });
  } catch (e) {
    return fail(400, e instanceof Error ? e.message : "Deposit failed");
  }
}
