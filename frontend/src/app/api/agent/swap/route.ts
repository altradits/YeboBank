import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { agentSwap } from "@/server/sim";
import { requireAgent, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isKes, normalisePhone } from "@/server/validate";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "agent", 30, 60_000);
  if (limited) return limited;
  const user = await requireAgent(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  const from = body?.from;
  const to = body?.to;
  if ((from !== "cash" && from !== "mpesa") || (to !== "cash" && to !== "mpesa") || from === to) {
    return fail(400, "Bad swap direction");
  }
  if (!isKes(body?.amountKes)) return fail(400, "KES amount required");
  let mpesa: string | undefined;
  if (body?.mpesaNumber !== undefined) {
    const n = normalisePhone(body.mpesaNumber);
    if (!n) return fail(400, "Bad M-Pesa number");
    mpesa = n;
  }
  const u = user as { id: string };
  const entry = await mutate((db) => agentSwap(db, u.id, from, to, body.amountKes as number, mpesa));
  return ok({ ok: true, entry });
}
