// Shared Lightning credit path: the deposit webhook and the status poll
// both land here. Idempotent by payment hash (ledger ref `ln:<hash>`).

import type { DbShape } from "./store";
import { postTx } from "./ledger";

export function creditLightningDeposit(
  db: DbShape,
  userId: string,
  paymentHash: string,
  amountSats: number,
): void {
  postTx(
    db,
    [
      { account: "external:lightning", debitSats: amountSats },
      { account: `user:${userId}`, creditSats: amountSats },
    ],
    {
      type: "deposit_lightning",
      note: `Testnet Lightning deposit +${amountSats.toLocaleString()} sats`,
      ref: `ln:${paymentHash}`,
    },
  );
}
