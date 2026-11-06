import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { stakeOf } from "@/server/chamas";
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
  try {
    return ok(await mutate((db) => stakeOf(db, u.handle, params.id)));
  } catch {
    return fail(404, "Chama not found");
  }
}
