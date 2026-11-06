import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { acceptInvite } from "@/server/locks";
import { requireUser, requireCsrf, ok, fail, throttle } from "@/server/http";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const limited = throttle(req, "savings", 30, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const u = user as { handle: string };
  try {
    await mutate((db) => acceptInvite(db, u.handle, params.id));
    return ok({ ok: true });
  } catch (e) {
    return fail(400, e instanceof Error ? e.message : "Accept failed");
  }
}
