import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/server/store";
import { getAltradits, destinationAddress } from "@/server/altradits";
import { requireUser, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isSats } from "@/server/validate";

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
  const sats = body?.sats;
  if (!isSats(sats) || sats > 10_000_000) return fail(400, "Deposit sats must be 1..10,000,000");

  let inv;
  try {
    inv = await getAltradits().createInvoice(sats, `YeboBank demo deposit to ${destinationAddress()}`);
  } catch (e) {
    return fail(502, e instanceof Error ? e.message : "Invoice failed");
  }
  await mutate((db) => {
    invoiceRows(db).push({
      hash: inv.paymentHash,
      userId: (user as { id: string }).id,
      amountSats: sats,
      createdAt: new Date().toISOString(),
      archivedAt: null,
    });
  });
  // satsCredited stays 0 until the signed webhook (or status poll) confirms.
  return ok({ invoice: inv.invoice, satsCredited: 0, paymentHash: inv.paymentHash });
}
