import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { agentCash } from "@/server/sim";
import { requireAgent, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isSats, normalisePhone } from "@/server/validate";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "agent", 30, 60_000);
  if (limited) return limited;
  const user = await requireAgent(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  const direction = body?.direction;
  if (direction !== "in" && direction !== "out") return fail(400, "Bad direction");
  const phone = normalisePhone(body?.phone);
  if (!phone) return fail(400, "Valid phone required");
  if (!isSats(body?.amountSats)) return fail(400, "Sats required");
  const u = user as { id: string };
  const out = await mutate((db) => agentCash(db, u.id, direction, phone, body.amountSats as number));
  return ok(out);
}
