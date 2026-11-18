import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { agentReactivate } from "@/server/sim";
import { requireAgent, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isText } from "@/server/validate";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "agent", 30, 60_000);
  if (limited) return limited;
  const user = await requireAgent(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  if (!isText(body?.contactId, 80)) return fail(400, "Contact required");
  if (!isText(body?.code, 20)) return fail(400, "Code required");
  const u = user as { id: string };
  const out = await mutate((db) => agentReactivate(db, u.id, String(body.contactId), String(body.code)));
  return ok(out);
}
