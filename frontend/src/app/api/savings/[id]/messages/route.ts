import { NextRequest, NextResponse } from "next/server";
import { mutate, read } from "@/server/store";
import { lockMessages, postLockMessage } from "@/server/locks";
import { requireUser, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isText } from "@/server/validate";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const limited = throttle(req, "savings", 60, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  return ok(read((db) => lockMessages(db, params.id)));
}

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
  const body = await readJson(req);
  const kind = body?.kind;
  if (kind !== "text" && kind !== "deposit" && kind !== "system") return fail(400, "Bad message kind");
  if (!isText(body?.body, 1000)) return fail(400, "Message body required");
  const u = user as { handle: string; fullName: string };
  try {
    const msg = await mutate((db) =>
      postLockMessage(db, params.id, {
        kind, authorHandle: u.handle, authorName: u.fullName,
        body: String(body.body), meta: (body.meta as Record<string, unknown>) ?? {},
      }),
    );
    return ok(msg);
  } catch (e) {
    return fail(400, e instanceof Error ? e.message : "Message failed");
  }
}
