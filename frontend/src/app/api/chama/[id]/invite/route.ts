import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { invite } from "@/server/chamas";
import { requireUser, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isText } from "@/server/validate";

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
  const contacts = body?.contacts;
  if (!Array.isArray(contacts) || !contacts.every((c) => isText(c, 80))) {
    return fail(400, "Contacts required");
  }
  const u = user as { handle: string; fullName: string };
  try {
    const n = await mutate((db) => invite(db, u.handle, u.fullName, params.id, contacts as string[]));
    return ok({ invited: n });
  } catch (e) {
    return fail(400, e instanceof Error ? e.message : "Invite failed");
  }
}
