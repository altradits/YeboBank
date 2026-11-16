import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { verifyWebhookSignature, parseWebhookEvent } from "@/lib/altradits";
import { webhookSecret } from "@/server/altradits";
import { ok, fail, throttle } from "@/server/http";
import { creditLightningDeposit } from "@/server/lightning-credit";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "webhook", 120, 60_000);
  if (limited) return limited;
  const secret = webhookSecret();
  if (!secret) return fail(503, "Webhook secret not configured");
  const raw = await req.text();
  const ts = req.headers.get("x-altradits-timestamp") || "";
  const sig = req.headers.get("x-altradits-signature") || "";
  if (!verifyWebhookSignature(secret, ts, raw, sig)) return fail(401, "Bad webhook signature");

  let body: unknown;
  try {
    body = JSON.parse(raw) as unknown;
  } catch {
    return fail(400, "Bad webhook JSON");
  }
  const event = parseWebhookEvent(body);
  if (!event) return fail(400, "Unknown webhook event");

  await mutate((db) => {
    const rows = (db.docs.invoices || []) as unknown as Array<{
      hash: string;
      userId: string;
      amountSats: number;
    }>;
    const inv = rows.find((r) => r.hash === event.paymentHash);
    if (!inv) return; // unknown invoice: acknowledge, credit nothing
    if (inv.amountSats !== event.amountSats) return; // amount mismatch: credit nothing
    creditLightningDeposit(db, inv.userId, event.paymentHash, event.amountSats);
  });
  return ok({ ok: true });
}
