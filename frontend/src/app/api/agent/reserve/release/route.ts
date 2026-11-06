import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { reserveRelease } from "@/server/sim";
import { requireAgent, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";

// Demo uses a 60s delay; production would use 15 minutes.
const RESERVE_DELAY_MS = process.env.YEBO_RESERVE_DELAY_MS ? Number(process.env.YEBO_RESERVE_DELAY_MS) : 60_000;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "agent", 20, 60_000);
  if (limited) return limited;
  const user = await requireAgent(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  const pin = typeof body?.pin === "string" ? body.pin : "";
  if (!pin) return fail(400, "PIN required");
  const u = user as { id: string };
  const out = await mutate((db) => reserveRelease(db, u.id, pin, RESERVE_DELAY_MS));
  return ok(out);
}
