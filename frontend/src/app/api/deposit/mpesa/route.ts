import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { stkPush } from "@/server/mpesa";
import { requireUser, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isKes } from "@/server/validate";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "mpesa-dep", 20, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  if (!isKes(body?.kes)) return fail(400, "KES amount required");
  try {
    const out = await mutate((db) => stkPush(db, (user as { id: string }).id, body.kes as number));
    return ok(out);
  } catch (e) {
    return fail(400, e instanceof Error ? e.message : "Deposit failed");
  }
}
