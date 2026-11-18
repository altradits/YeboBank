import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { listPositions, addPosition } from "@/server/sim";
import { requireMlinzi, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isText, isHandle } from "@/server/validate";

const RELS = ["self", "family", "friend", "investor"];

export async function GET(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "mlinzi", 60, 60_000);
  if (limited) return limited;
  const user = await requireMlinzi(req);
  if (user instanceof NextResponse) return user;
  return ok(await mutate((db) => listPositions(db)));
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "mlinzi", 30, 60_000);
  if (limited) return limited;
  const user = await requireMlinzi(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  if (!isHandle(body?.investorHandle)) return fail(400, "Investor @handle required");
  if (!isText(body?.investorName, 120)) return fail(400, "Investor name required");
  if (!RELS.includes(body?.relationship as string)) return fail(400, "Bad relationship");
  const pos = await mutate((db) =>
    addPosition(db, {
      investorHandle: String(body.investorHandle),
      investorName: String(body.investorName),
      relationship: body.relationship as "self" | "family" | "friend" | "investor",
      principalSats: typeof body.principalSats === "number" ? body.principalSats : 0,
      principalKesAtEntry: typeof body.principalKesAtEntry === "number" ? body.principalKesAtEntry : 0,
      entryDate: new Date().toISOString(),
      realizedReturnPctAnnual: typeof body.realizedReturnPctAnnual === "number" ? body.realizedReturnPctAnnual : 20,
      compounding: body.compounding !== false,
    }),
  );
  return ok(pos);
}
