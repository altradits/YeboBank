import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { requestWithdrawal } from "@/server/sim";
import { requireUser, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isSats } from "@/server/validate";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "invest", 20, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  if (!isSats(body?.sats)) return fail(400, "Sats required");
  const u = user as { handle: string };
  const wr = await mutate((db) => requestWithdrawal(db, u.handle, body.sats as number));
  return ok(wr);
}
