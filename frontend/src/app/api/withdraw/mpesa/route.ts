import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { b2c } from "@/server/mpesa";
import { requireUser, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isSats } from "@/server/validate";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "mpesa-wd", 20, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  if (!isSats(body?.sats)) return fail(400, "Sats amount required");
  try {
    await mutate((db) => b2c(db, (user as { id: string }).id, body.sats as number));
    return ok({ ok: true });
  } catch (e) {
    return fail(400, e instanceof Error ? e.message : "Withdrawal failed");
  }
}
