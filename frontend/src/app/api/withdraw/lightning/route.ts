// POST /api/withdraw/lightning — pay a BOLT11 invoice or Lightning address.
// Body: { invoiceOrAddress: string, sats: number, memo?: string }
// Returns: { ok, paymentId, status, feeSats? }
// Supports Idempotency-Key header (or body.idempotencyKey) — safe to retry.

export const runtime = "nodejs";

import { getBitcoinProvider } from "@/server/bitcoin";
import { assertLightningAmount, assertMemo, classifyDestination } from "@/server/bitcoin/validate";
import { err, idempotencyKey, ok, rateLimit, rateLimited, readJson, toErrorResponse } from "../../bitcoin/_lib";

export async function POST(req: Request): Promise<Response> {
  try {
    if (!rateLimit(req, "withdraw-lightning", 20)) return rateLimited();
    const body = await readJson(req);
    const sats = assertLightningAmount(body.sats as number, "sats");
    const { kind, value } = classifyDestination(body.invoiceOrAddress);
    const memo = assertMemo(body.memo);
    const key = idempotencyKey(req, body);
    const result = await getBitcoinProvider().payInvoice({
      ...(kind === "bolt11" ? { paymentRequest: value } : { lightningAddress: value }),
      amountSats: sats,
      memo,
      idempotencyKey: key,
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
