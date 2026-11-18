import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { positionForHandle } from "@/server/sim";
import { requireUser, ok, throttle } from "@/server/http";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "invest", 60, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const u = user as { handle: string };
  return ok(await mutate((db) => positionForHandle(db, u.handle)));
}
