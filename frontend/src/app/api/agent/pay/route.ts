// POST /api/agent/pay — agent pays a customer's Lightning invoice/address
// (guest Lightning→cash / Lightning→M-Pesa, member withdrawals).
// Body: { invoiceOrAddress: string, amountSats: number }

export const runtime = "nodejs";

import { getBitcoinProvider } from "@/server/bitcoin";
import { assertLightningAmount, classifyDestination } from "@/server/bitcoin/validate";
import { err, idempotencyKey, ok, rateLimit, rateLimited, readJson, toErrorResponse } from "../../bitcoin/_lib";

export async function POST(req: Request): Promise<Response> {
  try {
    if (!rateLimit(req, "agent-pay", 20)) return rateLimited();
    const body = await readJson(req);
    const amountSats = assertLightningAmount(body.amountSats as number, "amountSats");
    const { kind, value } = classifyDestination(body.invoiceOrAddress);
    const result = await getBitcoinProvider().payInvoice({
      ...(kind === "bolt11" ? { paymentRequest: value } : { lightningAddress: value }),
      amountSats,
      memo: "YeboBank agent payout",
      idempotencyKey: idempotencyKey(req, body),
    });
    return ok({
      ok: result.status !== "failed",
      paymentId: result.id,
      status: result.status,
      feeSats: result.feeSats ?? 0,
      failureReason: result.failureReason,
    });
  } catch (e) {
    if (e instanceof Error && e.name === "ValidationError") return err("VALIDATION_ERROR", e.message, 400);
    return toErrorResponse(e);
  }
}
