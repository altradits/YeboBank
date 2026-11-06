import { NextRequest, NextResponse } from "next/server";
import { getAltradits, destinationAddress } from "@/server/altradits";
import { requireAgent, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isSats } from "@/server/validate";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "agent", 20, 60_000);
  if (limited) return limited;
  const user = await requireAgent(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  if (!isSats(body?.amountSats)) return fail(400, "Sats required");
  try {
    const inv = await getAltradits().createInvoice(body.amountSats as number, `Agent float top-up to ${destinationAddress()}`);
    return ok({ invoice: inv.invoice });
  } catch (e) {
    return fail(502, e instanceof Error ? e.message : "Invoice failed");
  }
}
