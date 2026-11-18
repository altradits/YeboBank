import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { transfer } from "@/server/chamas";
import { requireUser, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isSats, isHandle } from "@/server/validate";

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
  if (!isHandle(body?.toHandle)) return fail(400, "Recipient @handle required");
  if (!isSats(body?.sats)) return fail(400, "Sats required");
  const u = user as { handle: string; fullName: string };
  try {
    await mutate((db) => transfer(db, u.handle, u.fullName, params.id, String(body.toHandle), body.sats as number));
    return ok({ ok: true });
  } catch (e) {
    return fail(400, e instanceof Error ? e.message : "Transfer failed");
  }
}
