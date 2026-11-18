import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { reserveClaim } from "@/server/sim";
import { requireAgent, requireCsrf, ok, fail, throttle } from "@/server/http";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "agent", 20, 60_000);
  if (limited) return limited;
  const user = await requireAgent(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const u = user as { id: string };
  try {
    const agent = await mutate((db) => reserveClaim(db, u.id));
    return ok(agent);
  } catch (e) {
    return fail(400, e instanceof Error ? e.message : "Claim failed");
  }
}
