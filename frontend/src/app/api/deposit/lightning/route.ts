// POST /api/deposit/lightning — create a Lightning invoice for a deposit.
// Auth + CSRF required. The invoice is tracked per-user; funds credit via
// the signed webhook (or status poll), NOT at creation time.
// Body: { sats: number, memo?: string }
// Returns: { invoice, satsCredited: 0, paymentHash }

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { getBitcoinProvider } from "@/server/bitcoin";
import { requireUser, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { assertLightningAmount, assertMemo } from "@/server/bitcoin/validate";
import { BitcoinError } from "@/server/bitcoin/types";

interface InvoiceRow {
  hash: string;
  userId: string;
  amountSats: number;
  createdAt: string;
  archivedAt: string | null;
}

function invoiceRows(db: { docs: Record<string, Record<string, unknown>[]> }): InvoiceRow[] {
  if (!db.docs.invoices) db.docs.invoices = [];
  return db.docs.invoices as unknown as InvoiceRow[];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "ln-deposit", 20, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);

  let sats: number;
  let memo: string | undefined;
  try {
    sats = assertLightningAmount(body?.sats as number, "sats");
    memo = assertMemo(body?.memo);
  } catch (e) {
    return fail(400, e instanceof Error ? e.message : "Invalid deposit request");
  }

  let inv;
  try {
    inv = await getBitcoinProvider().createInvoice({
      amountSats: sats,
      memo: memo ?? `YeboBank deposit for ${user.handle}`,
      metadata: { userId: user.id },
    });
  } catch (e) {
    const status = e instanceof BitcoinError ? e.status : 502;
    return fail(status, e instanceof Error ? e.message : "Invoice failed");
  }
  await mutate((db) => {
    invoiceRows(db).push({
      hash: inv.paymentHash,
      userId: user.id,
      amountSats: sats,
      createdAt: new Date().toISOString(),
      archivedAt: null,
    });
  });
  // satsCredited stays 0 until the signed webhook (or status poll) confirms.
  return ok({ invoice: inv.paymentRequest, satsCredited: 0, paymentHash: inv.paymentHash });
}
