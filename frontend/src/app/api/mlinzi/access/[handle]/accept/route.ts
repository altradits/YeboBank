import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { decideAccess } from "@/server/sim";
import { requireMlinzi, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";

export async function POST(
  req: NextRequest,
  { params }: { params: { handle: string } },
): Promise<NextResponse> {
  const limited = throttle(req, "mlinzi", 30, 60_000);
  if (limited) return limited;
  const user = await requireMlinzi(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  const rel = body?.relationship;
  if (rel !== "family" && rel !== "friend" && rel !== "investor") return fail(400, "Bad relationship");
  try {
    const r = await mutate((db) => decideAccess(db, decodeURIComponent(params.handle), true, rel));
    return ok(r);
  } catch (e) {
    return fail(400, e instanceof Error ? e.message : "Accept failed");
  }
}
