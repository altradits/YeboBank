import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { agentServiceAssist } from "@/server/sim";
import { requireAgent, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isSats, normalisePhone, isText } from "@/server/validate";

const LABELS: Record<string, string> = {
  savings_deposit: "Savings deposit",
  chama_contribution: "Chama contribution",
  withdrawal_request: "Withdrawal request",
  lightning_send: "Lightning send",
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "agent", 30, 60_000);
  if (limited) return limited;
  const user = await requireAgent(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  const phone = normalisePhone(body?.phone);
  if (!phone) return fail(400, "Valid phone required");
  const kind = body?.kind;
  if (typeof kind !== "string" || !(kind in LABELS)) return fail(400, "Bad service kind");
  if (!isSats(body?.amountSats)) return fail(400, "Sats required");
  const note = body?.note;
  if (note !== undefined && !isText(note, 300)) return fail(400, "Bad note");
  const u = user as { id: string };
  const entry = await mutate((db) =>
    agentServiceAssist(db, u.id, phone, LABELS[kind] as string, body.amountSats as number, note as string | undefined),
  );
  return ok({ ok: true, entry });
}
