// GET /api/bitcoin/onchain-address — fresh on-chain deposit address.
// Rate-limited: each call derives a new address on a real backend.

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // each call derives a fresh address

import { getBitcoinProvider } from "@/server/bitcoin";
import { ok, rateLimit, rateLimited, toErrorResponse } from "../_lib";

export async function GET(req: Request): Promise<Response> {
  try {
    if (!rateLimit(req, "onchain-address", 10)) return rateLimited();
    const addr = await getBitcoinProvider().newOnchainAddress();
    return ok(addr);
  } catch (e) {
    return toErrorResponse(e);
  }
}
