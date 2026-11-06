import { NextRequest, NextResponse } from "next/server";
import { getAltradits } from "@/server/altradits";
import { requireAgent, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isSats, isText } from "@/server/validate";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "agent", 20, 60_000);
  if (limited) return limited;
  const user = await requireAgent(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  if (!isText(body?.invoiceOrAddress, 1000)) return fail(400, "Invoice or address required");
  if (!isSats(body?.amountSats)) return fail(400, "Sats required");
  try {
    const pay = await getAltradits().pay(String(body.invoiceOrAddress), body.amountSats as number);
    if (pay.status !== "settled") return fail(502, "Testnet payment failed");
    return ok({ ok: true });
  } catch (e) {
    return fail(502, e instanceof Error ? e.message : "Payment failed");
  }
}
