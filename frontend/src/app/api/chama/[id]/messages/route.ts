import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { messages, postMessage } from "@/server/chamas";
import { requireUser, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isText } from "@/server/validate";

const KINDS = ["text", "system", "deposit", "withdrawal", "transfer", "vote", "join_request"] as const;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const limited = throttle(req, "chama", 60, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  return ok(await mutate((db) => messages(db, params.id)));
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const limited = throttle(req, "chama", 30, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  if (!KINDS.includes(body?.kind as (typeof KINDS)[number])) return fail(400, "Bad message kind");
  if (!isText(body?.body, 1000)) return fail(400, "Message body required");
  const u = user as { handle: string; fullName: string };
  try {
    const msg = await mutate((db) =>
      postMessage(db, params.id, {
        kind: body.kind as (typeof KINDS)[number],
        authorHandle: u.handle,
        authorName: u.fullName,
        body: String(body.body),
        meta: (body.meta as Record<string, unknown>) ?? {},
      }),
    );
    return ok(msg);
  } catch (e) {
    return fail(400, e instanceof Error ? e.message : "Message failed");
  }
}
