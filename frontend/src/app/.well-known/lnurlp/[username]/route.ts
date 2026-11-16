// GET /.well-known/lnurlp/{username} — LNURL-pay metadata so every YeboBank
// user can receive at {username}@LIGHTNING_DOMAIN from any Lightning wallet.
// Spec: https://github.com/lnurl/luds/blob/luds/06.md

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getBitcoinConfig } from "@/server/bitcoin/config";
import { MAX_LIGHTNING_SATS, MIN_LIGHTNING_SATS } from "@/server/bitcoin/validate";
import { err, ok } from "@/app/api/bitcoin/_lib";

export async function GET(_req: Request, ctx: { params: { username: string } }): Promise<Response> {
  const cfg = getBitcoinConfig();
  const username = ctx.params.username?.trim().toLowerCase();
  if (!username || !/^[a-z0-9._-]{2,64}$/.test(username)) {
    return err("VALIDATION_ERROR", "unknown lightning address", 404);
  }
  // TODO(users): look the username up in the user DB and 404 when it has no
  // wallet. Today every well-formed name resolves (mock-user phase).
  const callback = `${cfg.appBaseUrl}/api/lnurlp/callback?username=${encodeURIComponent(username)}`;
  return ok({
    tag: "payRequest",
    callback,
    minSendable: MIN_LIGHTNING_SATS * 1000, // msats
    maxSendable: MAX_LIGHTNING_SATS * 1000, // msats
    metadata: JSON.stringify([
      ["text/plain", `Pay ${username}@${cfg.lightningDomain} via YeboBank`],
      ["text/identifier", `${username}@${cfg.lightningDomain}`],
    ]),
    commentAllowed: 140,
  });
}
