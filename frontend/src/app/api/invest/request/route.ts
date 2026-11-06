import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { requestAccess } from "@/server/sim";
import { requireUser, requireCsrf, ok, throttle } from "@/server/http";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "invest", 20, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const u = user as { handle: string; fullName: string };
  await mutate((db) => requestAccess(db, u.handle, u.fullName));
  return ok({ ok: true });
}
