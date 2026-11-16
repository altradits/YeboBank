// POST /api/withdraw/lightning — pay a BOLT11 invoice or Lightning address
// from the signed-in user's ledger balance. Auth + CSRF required.
// Body: { invoiceOrAddress: string, sats: number, memo?: string }
// Returns: { ok, paymentId, status }

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { mutate, read } from "@/server/store";
import { balanceOf, postTx } from "@/server/ledger";
import { getBitcoinProvider } from "@/server/bitcoin";
import { requireUser, requireCsrf, ok, fail, throttle, readJson } from "@/server/http";
import { assertLightningAmount, assertMemo, classifyDestination } from "@/server/bitcoin/validate";
import { BitcoinError } from "@/server/bitcoin/types";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = throttle(req, "ln-withdraw", 20, 60_000);
  if (limited) return limited;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const csrf = requireCsrf(req);
  if (csrf) return csrf;
  const body = await readJson(req);

  let sats: number;
  let dest: { kind: "bolt11" | "lightning_address"; value: string };
  let memo: string | undefined;
  try {
    sats = assertLightningAmount(body?.sats as number, "sats");
    dest = classifyDestination(body?.invoiceOrAddress);
    memo = assertMemo(body?.memo);
  } catch (e) {
    return fail(400, e instanceof Error ? e.message : "Invalid payment request");
  }

  const uid = user.id;
  const balance = read((db) => balanceOf(db, `user:${uid}`));
  if (balance < sats) return fail(402, "Insufficient test-sat balance");

  const idempotencyKey = req.headers.get("idempotency-key")?.trim().slice(0, 128) || undefined;
  let pay;
  try {
    pay = await getBitcoinProvider().payInvoice({
      ...(dest.kind === "bolt11" ? { paymentRequest: dest.value } : { lightningAddress: dest.value }),
      amountSats: sats,
      memo,
      idempotencyKey,
    });
  } catch (e) {
    const status = e instanceof BitcoinError ? e.status : 502;
    return fail(status, e instanceof Error ? e.message : "Payment failed");
  }
  if (pay.status !== "settled") return fail(502, pay.failureReason || "Testnet payment failed");
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
        ref: `lnpay:${pay.id}`,
      },
    ),
  );
  return ok({ ok: true, paymentId: pay.id, status: pay.status });
}
