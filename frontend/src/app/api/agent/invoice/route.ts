// POST /api/agent/invoice — agent generates an invoice for the customer in front
// of the counter (guest cash-in or member Lightning deposit).
// Auth + CSRF required. Body: { amountSats: number }

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getBitcoinProvider } from "@/server/bitcoin";
import { requireUser, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { assertLightningAmount } from "@/server/bitcoin/validate";
import { BitcoinError } from "@/server/bitcoin/types";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "agent-invoice", 30, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  // TODO(agent): require user.isAgent (or a teller role) once agent onboarding
  // writes isAgent; today any signed-in user may operate the counter in demo.
  void user;
  const body = await readJson(req);

  let amountSats: number;
  try {
    amountSats = assertLightningAmount(body?.amountSats as number, "amountSats");
  } catch (e) {
    return fail(400, e instanceof Error ? e.message : "Invalid amount");
  }
  try {
    const inv = await getBitcoinProvider().createInvoice({ amountSats, memo: "YeboBank agent sale" });
    return ok({ invoice: inv.paymentRequest, paymentHash: inv.paymentHash, expiresAt: inv.expiresAt });
  } catch (e) {
    const status = e instanceof BitcoinError ? e.status : 502;
    return fail(status, e instanceof Error ? e.message : "Invoice failed");
  }
}
