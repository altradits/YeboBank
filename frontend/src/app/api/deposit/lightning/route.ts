// POST /api/deposit/lightning — create a Lightning invoice for a deposit.
// Body: { sats: number, memo?: string }
// Returns: { invoice, paymentHash, expiresAt, status }
// The UI shows the invoice as a QR; funds credit when the invoice settles
// (webhook or status polling), NOT at creation time.

export const runtime = "nodejs";

import { getBitcoinProvider } from "@/server/bitcoin";
import { assertLightningAmount, assertMemo } from "@/server/bitcoin/validate";
import { err, idempotencyKey, ok, rateLimit, rateLimited, readJson, toErrorResponse } from "../../bitcoin/_lib";

export async function POST(req: Request): Promise<Response> {
  try {
    if (!rateLimit(req, "deposit-lightning")) return rateLimited();
    const body = await readJson(req);
    const sats = assertLightningAmount(body.sats as number, "sats");
    const memo = assertMemo(body.memo) ?? "YeboBank deposit";
    void idempotencyKey(req, body); // invoices are single-use; key reserved for future use
    const inv = await getBitcoinProvider().createInvoice({ amountSats: sats, memo });
    // satsCredited stays 0 until settlement — kept for UI type compatibility.
    return ok({ invoice: inv.paymentRequest, paymentHash: inv.paymentHash, expiresAt: inv.expiresAt, status: inv.status, satsCredited: 0 });
  } catch (e) {
    if (e instanceof Error && e.name === "ValidationError") return err("VALIDATION_ERROR", e.message, 400);
    return toErrorResponse(e);
  }
}
