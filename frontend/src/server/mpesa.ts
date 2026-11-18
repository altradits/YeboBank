// Fake M-Pesa rail with the same contract as STK push / B2C (documented in
// docs/MPESA_CONTRACT.md). Clearly simulated: fixed illustrative rate, no
// network calls, test sats only.

import type { DbShape } from "./store";
import { postTx, balanceOf } from "./ledger";

/** Illustrative fixed rate so the demo is deterministic. Not a market rate. */
export const SIM_SATS_PER_KES = 8.33;

export function kesToSats(kes: number): number {
  return Math.round(kes * SIM_SATS_PER_KES);
}

/** Simulated STK push: credits test sats immediately in the demo. */
export function stkPush(db: DbShape, userId: string, kes: number): { checkoutRequestId: string; satsCredited: number } {
  const sats = kesToSats(kes);
  if (sats <= 0) throw new Error("Amount too small");
  postTx(
    db,
    [
      { account: "external:mpesa-fake", debitSats: sats },
      { account: `user:${userId}`, creditSats: sats },
    ],
    { type: "deposit_mpesa", note: `Simulated M-Pesa deposit KES ${kes.toLocaleString()} → +${sats.toLocaleString()} sats` },
  );
  return { checkoutRequestId: `ws_CO_${Date.now()}`, satsCredited: sats };
}

/** Simulated B2C payout: debits test sats immediately in the demo. */
export function b2c(db: DbShape, userId: string, sats: number): void {
  if (balanceOf(db, `user:${userId}`) < sats) throw new Error("Insufficient test-sat balance");
  postTx(
    db,
    [
      { account: `user:${userId}`, debitSats: sats },
      { account: "external:mpesa-fake", creditSats: sats },
    ],
    { type: "withdrawal_mpesa", note: `Simulated M-Pesa withdrawal: -${sats.toLocaleString()} sats` },
  );
}
