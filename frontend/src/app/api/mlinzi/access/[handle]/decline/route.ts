import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { decideAccess } from "@/server/sim";
import { requireMlinzi, requireCsrf, ok, fail, throttle } from "@/server/http";

export async function POST(
  req: NextRequest,
  { params }: { params: { handle: string } },
): Promise<NextResponse> {
  const limited = throttle(req, "mlinzi", 30, 60_000);
  if (limited) return limited;
  const user = await requireMlinzi(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  try {
    const r = await mutate((db) => decideAccess(db, decodeURIComponent(params.handle), false));
    return ok(r);
  } catch (e) {
    return fail(400, e instanceof Error ? e.message : "Decline failed");
  }
}
