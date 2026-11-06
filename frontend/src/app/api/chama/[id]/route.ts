import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { getChamaRow, toChama } from "@/server/chamas";
import { requireUser, ok, fail, throttle } from "@/server/http";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const limited = throttle(req, "chama", 60, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const u = user as { handle: string };
  const chama = await mutate((db) => {
    const row = getChamaRow(db, params.id);
    return row ? toChama(db, row, u.handle) : null;
  });
  if (!chama) return fail(404, "Chama not found");
  return ok(chama);
}
