import { NextRequest, NextResponse } from "next/server";
import { mutate, read } from "@/server/store";
import { getBitcoinProvider } from "@/server/bitcoin";
import { isBitcoinError } from "@/server/bitcoin/types";
import { requireUser, ok, fail, throttle } from "@/server/http";
import { creditLightningDeposit } from "@/server/lightning-credit";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "ln-status", 60, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const hash = req.nextUrl.searchParams.get("hash") || "";
  if (!/^[0-9a-f]{64}$/.test(hash)) return fail(400, "Payment hash required");

  // Query the ACTIVE rail (deposits are created through it), not the
  // Altradits port directly — otherwise mock/LND invoices are invisible here.
  let inv;
  try {
    inv = await getBitcoinProvider().lookupInvoice(hash);
  } catch (e) {
    if (isBitcoinError(e) && e.code === "INVOICE_NOT_FOUND") {
      return ok({ status: "unknown", amountSats: 0, settledAt: null });
    }
    return fail(502, e instanceof Error ? e.message : "Status failed");
  }
  // Provider vocabulary → backend vocabulary (expired settles nothing, like failed).
  const status =
    inv.status === "settled" ? "settled"
    : inv.status === "failed" || inv.status === "expired" ? "failed"
    : "pending";
  if (status === "settled") {
    const uid = (user as { id: string }).id;
    const mine = read((db) => {
      const rows = (db.docs.invoices || []) as unknown as Array<{ hash: string; userId: string }>;
      return rows.some((r) => r.hash === hash && r.userId === uid);
    });
    if (mine) {
      await mutate((db) => creditLightningDeposit(db, uid, hash, inv.amountSats));
    }
  }
  return ok({ status, amountSats: inv.amountSats, settledAt: inv.settledAt ?? null });
}
