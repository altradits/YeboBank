import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { deploy } from "@/server/sim";
import { requireMlinzi, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isSats, isText } from "@/server/validate";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "mlinzi", 20, 60_000);
  if (limited) return limited;
  const user = await requireMlinzi(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  const method = body?.method;
  if (method !== "mpesa" && method !== "lightning" && method !== "card") return fail(400, "Bad method");
  if (!isSats(body?.amountSats)) return fail(400, "Sats required");
  if (typeof body?.amountKes !== "number" || (body.amountKes as number) < 0) return fail(400, "Bad KES");
  if (!isText(body?.destination, 300)) return fail(400, "Destination required");
  const dep = await mutate((db) =>
    deploy(db, {
      method,
      amountSats: body.amountSats as number,
      amountKes: body.amountKes as number,
      destination: String(body.destination),
      notes: typeof body.notes === "string" ? body.notes.slice(0, 500) : undefined,
    }),
  );
  return ok(dep);
}
