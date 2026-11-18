import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { agentLedger } from "@/server/sim";
import { requireAgent, ok, throttle } from "@/server/http";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "agent", 60, 60_000);
  if (limited) return limited;
  const user = await requireAgent(req);
  if (user instanceof NextResponse) return user;
  const u = user as { id: string };
  return ok(await mutate((db) => agentLedger(db, u.id)));
}
