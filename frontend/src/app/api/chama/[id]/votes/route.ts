import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { votes, createVote } from "@/server/chamas";
import { requireUser, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isText } from "@/server/validate";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const limited = throttle(req, "chama", 60, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  return ok(await mutate((db) => votes(db, params.id)));
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
  const body = await readJson(req);
  if (!isText(body?.question, 300)) return fail(400, "Question required");
  const options = body?.options;
  if (!Array.isArray(options) || options.length < 2 || options.length > 10 || !options.every((o) => isText(o, 100))) {
    return fail(400, "2..10 options required");
  }
  try {
    const vote = await mutate((db) => createVote(db, params.id, String(body.question), options as string[]));
    return ok(vote);
  } catch (e) {
    return fail(400, e instanceof Error ? e.message : "Vote failed");
  }
}
