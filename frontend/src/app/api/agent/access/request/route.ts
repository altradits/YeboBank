import { NextRequest, NextResponse } from "next/server";
import { mutate, nextId, type DbShape } from "@/server/store";
import { requireAgent, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { normalisePhone } from "@/server/validate";

interface CodeRow {
  id: string;
  phone: string;
  code: string;
  channel: string;
  expiresAt: string;
  archivedAt: string | null;
}

function codes(db: DbShape): CodeRow[] {
  if (!db.docs.agentCodes) db.docs.agentCodes = [];
  return db.docs.agentCodes as unknown as CodeRow[];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "agent", 20, 60_000);
  if (limited) return limited;
  const user = await requireAgent(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  const phone = normalisePhone(body?.phone);
  const channel = body?.channel;
  if (!phone) return fail(400, "Valid phone required");
  if (channel !== "sms" && channel !== "email" && channel !== "offline") return fail(400, "Bad channel");
  // Simulated OTP: generated and stored server-side (demo: no SMS sent).
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await mutate((db) => {
    codes(db).push({
      id: nextId(db, "ac"), phone, code, channel,
      expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(), archivedAt: null,
    });
  });
  return ok({ sent: true });
}
