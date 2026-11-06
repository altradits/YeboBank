import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { agentPanic } from "@/server/sim";
import { requireAgent, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "agent", 20, 60_000);
  if (limited) return limited;
  const user = await requireAgent(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  const level = body?.level;
  if (level !== 1 && level !== 2 && level !== 3) return fail(400, "Panic level 1..3 required");
  const u = user as { id: string };
  const out = await mutate((db) => agentPanic(db, u.id, level));
  return ok(out);
}
