import { NextRequest, NextResponse } from "next/server";
import { mutate, read } from "@/server/store";
import { balanceOf, postTx } from "@/server/ledger";
import { getAltradits } from "@/server/altradits";
import { requireUser, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { isSats, isText } from "@/server/validate";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "ln-withdraw", 20, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);
  const target = body?.invoiceOrAddress;
  const sats = body?.sats;
  if (!isText(target, 1000)) return fail(400, "Invoice or Lightning address required");
  if (!isSats(sats) || sats > 10_000_000) return fail(400, "Send sats must be 1..10,000,000");

  const uid = (user as { id: string }).id;
  const balance = read((db) => balanceOf(db, `user:${uid}`));
  if (balance < sats) return fail(402, "Insufficient test-sat balance");

  let pay;
  try {
    pay = await getAltradits().pay(String(target), sats);
  } catch (e) {
    return fail(502, e instanceof Error ? e.message : "Payment failed");
  }
  if (pay.status !== "settled") return fail(502, "Testnet payment failed");
  await mutate((db) =>
    postTx(
      db,
      [
        { account: `user:${uid}`, debitSats: sats },
        { account: "external:lightning", creditSats: sats },
      ],
      {
        type: "withdrawal_lightning",
        note: `Testnet Lightning send -${sats.toLocaleString()} sats`,
        ref: `lnpay:${pay.paymentHash}`,
      },
    ),
  );
  return ok({ ok: true });
}
