import { NextRequest, NextResponse } from "next/server";
import { read } from "@/server/store";
import { getLockRow, listLocks } from "@/server/locks";
import { requireUser, ok, fail, throttle } from "@/server/http";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const limited = throttle(req, "savings", 60, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const u = user as { id: string; handle: string };
  const found = read((db) => {
    const row = getLockRow(db, params.id);
    if (!row) return null;
    const mine = listLocks(db, u.id, u.handle).find((l) => l.id === params.id);
    return mine ?? null;
  });
  if (!found) return fail(404, "Lock not found");
  return ok(found);
}
