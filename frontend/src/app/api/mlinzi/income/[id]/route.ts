import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { removeIncome } from "@/server/sim";
import { requireMlinzi, requireCsrf, ok, throttle } from "@/server/http";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const limited = throttle(req, "mlinzi", 30, 60_000);
  if (limited) return limited;
  const user = await requireMlinzi(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  await mutate((db) => removeIncome(db, params.id));
  return ok({ ok: true });
}
