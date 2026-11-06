import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { reserveAdd } from "@/server/sim";
import { requireAgent, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isSats } from "@/server/validate";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "agent", 30, 60_000);
  if (limited) return limited;
  const user = await requireAgent(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  if (!isSats(body?.sats)) return fail(400, "Sats required");
  const u = user as { id: string };
  const agent = await mutate((db) => reserveAdd(db, u.id, body.sats as number));
  return ok(agent);
}
