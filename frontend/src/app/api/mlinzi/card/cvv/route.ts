import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { rotateCvv } from "@/server/sim";
import { requireMlinzi, requireCsrf, ok, fail, throttle } from "@/server/http";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "mlinzi", 30, 60_000);
  if (limited) return limited;
  const user = await requireMlinzi(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  try {
    return ok(await mutate((db) => rotateCvv(db)));
  } catch {
    return fail(404, "No card");
  }
}
