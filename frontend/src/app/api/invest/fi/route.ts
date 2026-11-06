import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { getFI, setFI } from "@/server/sim";
import { requireUser, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isHandle } from "@/server/validate";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "invest", 60, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const u = user as { handle: string };
  return ok(await mutate((db) => getFI(db, u.handle, 1_200_000)));
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "invest", 30, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  if (!isHandle(body?.handle)) return fail(400, "Handle required");
  if (typeof body?.annualExpensesKes !== "number" || (body.annualExpensesKes as number) < 0) {
    return fail(400, "Bad expenses");
  }
  const profile = await mutate((db) =>
    setFI(db, {
      handle: String(body.handle),
      annualExpensesKes: body.annualExpensesKes as number,
      fiRule: typeof body.fiRule === "number" ? body.fiRule : 0.04,
      assumedReturnPctAnnual: typeof body.assumedReturnPctAnnual === "number" ? body.assumedReturnPctAnnual : 20,
    }),
  );
  return ok(profile);
}
