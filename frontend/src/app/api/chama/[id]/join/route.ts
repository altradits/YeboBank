import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { joinRequests, requestJoin } from "@/server/chamas";
import { requireUser, requireCsrf, ok, fail, throttle } from "@/server/http";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const limited = throttle(req, "chama", 60, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  return ok(await mutate((db) => joinRequests(db, params.id)));
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const limited = throttle(req, "chama", 20, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const u = user as { handle: string; fullName: string };
  try {
    const jr = await mutate((db) => requestJoin(db, { handle: u.handle, name: u.fullName }, params.id));
    return ok(jr);
  } catch (e) {
    return fail(400, e instanceof Error ? e.message : "Join failed");
  }
}
