import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { castVote } from "@/server/chamas";
import { requireUser, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isText } from "@/server/validate";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; voteId: string } },
): Promise<NextResponse> {
  const limited = throttle(req, "chama", 30, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  if (!isText(body?.option, 100)) return fail(400, "Option required");
  const u = user as { handle: string };
  try {
    const vote = await mutate((db) => castVote(db, u.handle, params.id, params.voteId, String(body.option)));
    return ok(vote);
  } catch (e) {
    return fail(400, e instanceof Error ? e.message : "Cast failed");
  }
}
