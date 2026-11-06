import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { voteOnJoin } from "@/server/chamas";
import { requireUser, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; requestId: string } },
): Promise<NextResponse> {
  const limited = throttle(req, "chama", 30, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  if (typeof body?.approve !== "boolean") return fail(400, "approve boolean required");
  const u = user as { handle: string };
  try {
    const jr = await mutate((db) => voteOnJoin(db, u.handle, params.id, params.requestId, body.approve as boolean));
    return ok(jr);
  } catch (e) {
    return fail(400, e instanceof Error ? e.message : "Vote failed");
  }
}
