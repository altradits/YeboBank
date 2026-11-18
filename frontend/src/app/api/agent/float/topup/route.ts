// POST /api/agent/float/topup — agent tops up their own sats float by paying
// a self-generated invoice from a personal wallet.
// Agents only + CSRF required. Body: { amountSats: number }

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getBitcoinProvider } from "@/server/bitcoin";
import { requireAgent, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { assertLightningAmount } from "@/server/bitcoin/validate";
import { isBitcoinError } from "@/server/bitcoin/types";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "agent", 20, 60_000);
  if (limited) return limited;
  const user = await requireAgent(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  void user;
  const body = await readJson(req);

  let amountSats: number;
  try {
    amountSats = assertLightningAmount(body?.amountSats as number, "amountSats");
  } catch (e) {
    return fail(400, e instanceof Error ? e.message : "Invalid amount");
  }
  try {
    const inv = await getBitcoinProvider().createInvoice({ amountSats, memo: "YeboBank agent float top-up" });
    return ok({ invoice: inv.paymentRequest, paymentHash: inv.paymentHash, expiresAt: inv.expiresAt });
  } catch (e) {
    const status = isBitcoinError(e) ? e.status : 502;
    return fail(status, e instanceof Error ? e.message : "Invoice failed");
  }
}
