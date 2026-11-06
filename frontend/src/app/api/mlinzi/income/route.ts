import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { listIncome, upsertIncome } from "@/server/sim";
import { requireMlinzi, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isText } from "@/server/validate";
import type { IncomeSource } from "@/types";

const TYPES = ["real_estate", "govt_bond", "tbill", "fund", "business", "other"];

export async function GET(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "mlinzi", 60, 60_000);
  if (limited) return limited;
  const user = await requireMlinzi(req);
  if (user instanceof NextResponse) return user;
  return ok(await mutate((db) => listIncome(db)));
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "mlinzi", 30, 60_000);
  if (limited) return limited;
  const user = await requireMlinzi(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  if (!isText(body?.name, 120)) return fail(400, "Name required");
  if (!TYPES.includes(body?.type as string)) return fail(400, "Bad income type");
  if (typeof body?.principalKes !== "number" || body.principalKes < 0) return fail(400, "Bad principal");
  if (typeof body?.realizedReturnPctAnnual !== "number") return fail(400, "Bad return");
  if (body?.liquidity !== "liquid" && body?.liquidity !== "illiquid") return fail(400, "Bad liquidity");
  const source = (await mutate((db) =>
    upsertIncome(db, {
      id: typeof body.id === "string" ? body.id : "",
      name: String(body.name),
      type: body.type as IncomeSource["type"],
      principalKes: body.principalKes as number,
      realizedReturnPctAnnual: body.realizedReturnPctAnnual as number,
      compounding: body.compounding !== false,
      liquidity: body.liquidity as IncomeSource["liquidity"],
      notes: typeof body.notes === "string" ? String(body.notes).slice(0, 500) : undefined,
    }),
  ));
  return ok(source);
}
