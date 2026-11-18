import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { postStatement } from "@/server/sim";
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
  if (typeof body?.returnKes !== "number" || !Number.isFinite(body.returnKes)) {
    return fail(400, "returnKes required");
  }
  try {
    const pos = await mutate((db) => postStatement(db, params.id, body.returnKes as number));
    return ok(pos);
  } catch (e) {
    return fail(400, e instanceof Error ? e.message : "Statement failed");
  }
}
