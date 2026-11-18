import { NextRequest, NextResponse } from "next/server";
import { read } from "@/server/store";
import { listLocks } from "@/server/locks";
import { requireUser, ok, throttle } from "@/server/http";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "savings", 60, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const u = user as { id: string; handle: string };
  return ok(read((db) => listLocks(db, u.id, u.handle)));
}
