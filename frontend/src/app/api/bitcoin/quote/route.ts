// GET /api/bitcoin/quote?from=KES&to=SATS&amount=1000 — FX quote with fee.
// Always resolved via the FX desk (Altradits live or sandbox), even when the
// active provider is LND — see getQuoteWithFallback.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getQuoteWithFallback } from "@/server/bitcoin";
import { err, ok, rateLimit, rateLimited, toErrorResponse } from "../_lib";

const CURS = new Set(["KES", "SATS", "BTC"]);

export async function GET(req: Request): Promise<Response> {
  try {
    if (!rateLimit(req, "quote", 60)) return rateLimited();
    const url = new URL(req.url);
    const from = (url.searchParams.get("from") ?? "").toUpperCase();
    const to = (url.searchParams.get("to") ?? "").toUpperCase();
    const amount = Number(url.searchParams.get("amount"));
    if (!CURS.has(from) || !CURS.has(to)) {
      return err("VALIDATION_ERROR", "from/to must each be KES, SATS, or BTC", 400);
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return err("VALIDATION_ERROR", "amount must be a positive number", 400);
    }
    const quote = await getQuoteWithFallback({
      from: from as "KES" | "SATS" | "BTC",
      to: to as "KES" | "SATS" | "BTC",
      amount,
    });
    return ok(quote);
  } catch (e) {
    return toErrorResponse(e);
  }
}
