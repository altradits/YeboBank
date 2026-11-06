import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { markRead } from "@/server/sim";
import { requireUser, requireCsrf, ok, throttle } from "@/server/http";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const limited = throttle(req, "invest", 60, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  await mutate((db) => markRead(db, params.id));
  return ok({ ok: true });
}
