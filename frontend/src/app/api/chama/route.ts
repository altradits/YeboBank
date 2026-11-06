import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { listChamas } from "@/server/chamas";
import { requireUser, ok, throttle } from "@/server/http";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "chama", 60, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const u = user as { handle: string };
  // mutate (not read): persists the demo-chama seed on first call.
  return ok(await mutate((db) => listChamas(db, u.handle, true)));
}
