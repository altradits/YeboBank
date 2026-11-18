// POST /api/agent/pay — agent pays a customer's Lightning invoice/address
// (guest Lightning→cash / Lightning→M-Pesa, member withdrawals).
// Auth + CSRF required. Body: { invoiceOrAddress: string, amountSats: number }

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getBitcoinProvider } from "@/server/bitcoin";
import { requireUser, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { assertLightningAmount, classifyDestination } from "@/server/bitcoin/validate";
import { isBitcoinError } from "@/server/bitcoin/types";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "agent-pay", 20, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  // TODO(agent): require user.isAgent once agent onboarding writes isAgent.
  void user;
  const body = await readJson(req);

  let amountSats: number;
  let dest: { kind: "bolt11" | "lightning_address"; value: string };
  try {
    amountSats = assertLightningAmount(body?.amountSats as number, "amountSats");
    dest = classifyDestination(body?.invoiceOrAddress);
  } catch (e) {
    return fail(400, e instanceof Error ? e.message : "Invalid payment request");
  }
  const idempotencyKey = req.headers.get("idempotency-key")?.trim().slice(0, 128) || undefined;
  try {
    const result = await getBitcoinProvider().payInvoice({
      ...(dest.kind === "bolt11" ? { paymentRequest: dest.value } : { lightningAddress: dest.value }),
      amountSats,
      memo: "YeboBank agent payout",
      idempotencyKey,
    });
    return ok({
      ok: result.status !== "failed",
      paymentId: result.id,
      status: result.status,
      feeSats: result.feeSats ?? 0,
      failureReason: result.failureReason,
    });
  } catch (e) {
    const status = isBitcoinError(e) ? e.status : 502;
    return fail(status, e instanceof Error ? e.message : "Payment failed");
  }
}
