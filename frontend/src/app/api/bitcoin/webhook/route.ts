// POST /api/bitcoin/webhook — settlement callbacks from the rail.
//
// Altradits: configure this URL in the Altradits dashboard with the same
// ALTRADITS_WEBHOOK_SECRET. The request must carry X-Altradits-Signature
// (HMAC-SHA256 hex of the raw body). Expected event shape:
//   { type: "invoice.settled" | "payment.settled" | "payment.failed",
//     invoice_id?: string, payment_id?: string, payment_hash?: string }
// LND: LND pushes no webhooks — this endpoint also accepts the bank's own
// invoice-poller callbacks in the same shape (auth via WEBHOOK_INTERNAL_TOKEN).
//
// On invoice.settled the bank credits the user's ledger — TODAY that step is
// a recorded TODO because the custodial ledger DB does not exist yet; the
// settlement is durably logged and visible via the invoice status endpoint.

export const runtime = "nodejs";

import { verifyAltraditsWebhook } from "@/server/bitcoin/altradits";
import { getBitcoinConfig } from "@/server/bitcoin/config";
import { getStore } from "@/server/bitcoin/store";
import { err, ok } from "../_lib";

type WebhookEvent =
  | { type: "invoice.settled"; invoice_id?: string; payment_hash?: string }
  | { type: "payment.settled" | "payment.failed"; payment_id?: string; failure_reason?: string };

export async function POST(req: Request): Promise<Response> {
  const raw = await req.text().catch(() => "");
  if (!raw) return err("VALIDATION_ERROR", "empty body", 400);

  const cfg = getBitcoinConfig();
  const sig = req.headers.get("x-altradits-signature");
  const internal = req.headers.get("x-internal-token");
  const internalToken = process.env.WEBHOOK_INTERNAL_TOKEN?.trim();

  const altraditsOk = verifyAltraditsWebhook(raw, sig, cfg.altradits.webhookSecret);
  const internalOk = Boolean(internalToken && internal && internal === internalToken);
  if (!altraditsOk && !internalOk) {
    return err("UNAUTHORIZED", "invalid webhook signature", 401);
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(raw) as WebhookEvent;
  } catch {
    return err("VALIDATION_ERROR", "body must be JSON", 400);
  }

  const store = getStore();
  const now = new Date().toISOString();
  if (event.type === "invoice.settled") {
    const id = event.invoice_id ?? event.payment_hash;
    if (!id) return err("VALIDATION_ERROR", "invoice_id or payment_hash is required", 400);
    const updated = store.setInvoiceStatus(id, "settled", now);
    // TODO(ledger): credit the custodial ledger for this invoice (user id is in
    // invoice metadata) inside a DB transaction keyed by payment_hash.
    console.log(`[webhook] invoice settled: ${id} (ledger credit pending: ${updated ? "tracked" : "unknown invoice"})`);
    return ok({ received: true });
  }
  if (event.type === "payment.settled" || event.type === "payment.failed") {
    if (!event.payment_id) return err("VALIDATION_ERROR", "payment_id is required", 400);
    store.setPaymentStatus(
      event.payment_id,
      event.type === "payment.settled" ? "settled" : "failed",
      event.failure_reason,
    );
    console.log(`[webhook] payment ${event.type}: ${event.payment_id}`);
    return ok({ received: true });
  }
  return err("VALIDATION_ERROR", `unknown event type ${(event as { type?: string }).type}`, 400);
}
