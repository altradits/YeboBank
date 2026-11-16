// GET /api/bitcoin/invoices/[hash] — poll an invoice until it settles.
// Used by the deposit UI after showing the QR.

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // status changes as invoices settle

import { getBitcoinProvider } from "@/server/bitcoin";
import { err, ok, rateLimit, rateLimited, toErrorResponse } from "../../_lib";

export async function GET(req: Request, ctx: { params: { hash: string } }): Promise<Response> {
  try {
    if (!rateLimit(req, "invoice-lookup", 60)) return rateLimited();
    const hash = ctx.params.hash?.trim();
    if (!hash) return err("VALIDATION_ERROR", "invoice id is required", 400);
    const inv = await getBitcoinProvider().lookupInvoice(hash);
    return ok(inv);
  } catch (e) {
    return toErrorResponse(e);
  }
}
