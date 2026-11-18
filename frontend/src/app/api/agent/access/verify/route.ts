import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { requireAgent, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { normalisePhone } from "@/server/validate";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "agent", 30, 60_000);
  if (limited) return limited;
  const user = await requireAgent(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  const phone = normalisePhone(body?.phone);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!phone || !code) return fail(400, "Phone and code required");
  const verified = await mutate((db) => {
    if (!db.docs.agentCodes) return false;
    const rows = db.docs.agentCodes as unknown as Array<{
      phone: string; code: string; expiresAt: string; archivedAt: string | null;
    }>;
    const row = rows.find(
      (r) => !r.archivedAt && r.phone === phone && r.code === code && new Date(r.expiresAt) > new Date(),
    );
    if (!row) return false;
    row.archivedAt = new Date().toISOString();
    return true;
  });
  return ok({ verified });
}
