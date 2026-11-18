import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { decideWithdrawal } from "@/server/sim";
import { requireMlinzi, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const limited = throttle(req, "mlinzi", 30, 60_000);
  if (limited) return limited;
  const user = await requireMlinzi(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  try {
    const wr = await mutate((db) =>
      decideWithdrawal(db, params.id, false, undefined, typeof body?.note === "string" ? body.note : undefined),
    );
    return ok(wr);
  } catch (e) {
    return fail(400, e instanceof Error ? e.message : "Decline failed");
  }
}
