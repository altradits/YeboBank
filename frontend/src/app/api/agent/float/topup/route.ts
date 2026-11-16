// POST /api/agent/float/topup — agent tops up their own sats float by paying
// a self-generated invoice from a personal wallet.
// Auth + CSRF required. Body: { amountSats: number }

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getBitcoinProvider } from "@/server/bitcoin";
import { requireUser, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { assertLightningAmount } from "@/server/bitcoin/validate";
import { BitcoinError } from "@/server/bitcoin/types";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "agent-topup", 30, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  // TODO(agent): require user.isAgent once agent onboarding writes isAgent.
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
    const status = e instanceof BitcoinError ? e.status : 502;
    return fail(status, e instanceof Error ? e.message : "Invoice failed");
  }
}
