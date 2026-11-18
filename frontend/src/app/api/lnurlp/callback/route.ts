// GET /api/lnurlp/callback?username={u}&amount={msats}[&comment=...]
// Second LNURL-pay step: returns a BOLT11 invoice for the requested amount.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getBitcoinProvider } from "@/server/bitcoin";
import { getBitcoinConfig } from "@/server/bitcoin/config";
import { read } from "@/server/store";
import { ensureSeeded } from "@/server/auth";
import { err, ok, rateLimit, rateLimited, toErrorResponse } from "../../bitcoin/_lib";

export async function GET(req: Request): Promise<Response> {
  try {
    if (!rateLimit(req, "lnurlp", 60)) return rateLimited();
    const url = new URL(req.url);
    const username = (url.searchParams.get("username") ?? "").trim().toLowerCase();
    const msats = Number(url.searchParams.get("amount"));
    const comment = (url.searchParams.get("comment") ?? "").slice(0, 140);
    if (!username || !/^[a-z0-9._-]{2,64}$/.test(username)) {
      return err("VALIDATION_ERROR", "unknown lightning address", 404);
    }
    await ensureSeeded();
    const domain = getBitcoinConfig().lightningDomain.toLowerCase();
    const known = read((db) =>
      db.users.some((u) => !u.archivedAt && u.lightningAddress.toLowerCase() === `${username}@${domain}`),
    );
    if (!known) return err("UNKNOWN_USER", "unknown lightning address", 404);
    if (!Number.isFinite(msats) || msats <= 0) {
      return err("VALIDATION_ERROR", "amount (msats) must be positive", 400);
    }
    const sats = Math.floor(msats / 1000);
    if (sats < 10) return err("VALIDATION_ERROR", "amount below minimum (10 sats)", 400);
    const inv = await getBitcoinProvider().createInvoice({
      amountSats: sats,
      memo: comment ? `To ${username}: ${comment}` : `Pay to ${username}@${domain}`,
      metadata: { lnurl_user: username },
    });
    return ok({ pr: inv.paymentRequest, routes: [] });
  } catch (e) {
    return toErrorResponse(e);
  }
}
