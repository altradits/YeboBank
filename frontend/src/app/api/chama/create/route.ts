import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { createChama } from "@/server/chamas";
import { requireUser, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isText, isSats } from "@/server/validate";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "chama", 20, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  if (!isText(body?.name, 80)) return fail(400, "Chama name required");
  const contributionSats = body?.contributionSats;
  if (contributionSats !== undefined && !isSats(contributionSats)) return fail(400, "Bad contribution");
  const u = user as { handle: string; fullName: string };
  const chama = await mutate((db) =>
    createChama(db, { handle: u.handle, name: u.fullName }, String(body.name), (contributionSats as number) ?? 0),
  );
  return ok(chama);
}
