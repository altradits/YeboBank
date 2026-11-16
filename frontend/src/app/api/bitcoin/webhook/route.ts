// POST /api/bitcoin/webhook — settlement callbacks from the bank's own
// invoice poller (LND pushes no webhooks — a worker polls invoice status and
// POSTs settlements here).
//
// This is NOT the Altradits webhook: Altradits-signed events go to the
// canonical /api/webhooks/altradits (see docs/ALTRADITS_CONTRACT.md), which
// verifies the Altradits signature and credits the ledger. This endpoint
// accepts ONLY the bank's internal token and the same event shape:
//   { type: "invoice.settled", payment_hash, amountSats? }
//   { type: "payment.settled" | "payment.failed", payment_id?, failure_reason? }
// Invoice settlements credit the custodial ledger idempotently by payment
// hash (ref ln:<hash>) when the invoice row names a user.

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { mutate, read } from "@/server/store";
import { creditLightningDeposit } from "@/server/lightning-credit";
import { getStore } from "@/server/bitcoin/store";
import { ok, fail, throttle } from "@/server/http";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "bitcoin-webhook", 120, 60_000);
  if (limited) return limited;

  const internalToken = process.env.WEBHOOK_INTERNAL_TOKEN?.trim();
  const sent = req.headers.get("x-internal-token")?.trim();
  if (!internalToken || !sent || sent !== internalToken) {
    return fail(401, "Invalid internal token");
  }

  let event: { type?: string; payment_hash?: string; invoice_id?: string; payment_id?: string; failure_reason?: string };
  try {
    event = (await req.json()) as typeof event;
  } catch {
    return fail(400, "Body must be JSON");
  }

  const store = getStore();
  const now = new Date().toISOString();
  if (event.type === "invoice.settled") {
    const hash = event.payment_hash ?? event.invoice_id;
    if (!hash) return fail(400, "payment_hash or invoice_id is required");
    store.setInvoiceStatus(hash, "settled", now);
    // Credit the owner's ledger account (idempotent by ln:<hash>).
    const row = read((db) => {
      const rows = (db.docs.invoices || []) as unknown as Array<{
        hash: string; userId: string; amountSats: number;
      }>;
      return rows.find((r) => r.hash === hash) ?? null;
    });
    if (row) {
      await mutate((db) => creditLightningDeposit(db, row.userId, hash, row.amountSats));
    }
    console.log(`[webhook] internal invoice settled: ${hash} (${row ? `credited user ${row.userId}` : "no invoice row, nothing credited"})`);
    return ok({ received: true });
  }
  if (event.type === "payment.settled" || event.type === "payment.failed") {
    if (!event.payment_id) return fail(400, "payment_id is required");
    store.setPaymentStatus(
      event.payment_id,
      event.type === "payment.settled" ? "settled" : "failed",
      event.failure_reason,
    );
    return ok({ received: true });
  }
  return fail(400, `Unknown event type ${event.type}`);
}
