// POST /api/agent/invoice — agent generates an invoice for the customer in front
// of the counter (guest cash-in or member Lightning deposit).
// Body: { amountSats: number }

export const runtime = "nodejs";

import { getBitcoinProvider } from "@/server/bitcoin";
import { assertLightningAmount } from "@/server/bitcoin/validate";
import { err, ok, rateLimit, rateLimited, readJson, toErrorResponse } from "../../bitcoin/_lib";

export async function POST(req: Request): Promise<Response> {
  try {
    if (!rateLimit(req, "agent-invoice")) return rateLimited();
    const body = await readJson(req);
    const amountSats = assertLightningAmount(body.amountSats as number, "amountSats");
    const inv = await getBitcoinProvider().createInvoice({ amountSats, memo: "YeboBank agent sale" });
    return ok({ invoice: inv.paymentRequest, paymentHash: inv.paymentHash, expiresAt: inv.expiresAt });
  } catch (e) {
    if (e instanceof Error && e.name === "ValidationError") return err("VALIDATION_ERROR", e.message, 400);
    return toErrorResponse(e);
  }
}
