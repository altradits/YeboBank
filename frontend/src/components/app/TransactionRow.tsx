"use client";

import { useRate } from "@/lib/rate-context";
import { num, fmtKES, timeAgo } from "@/lib/format";
import type { LedgerEntry } from "@/types";

const LABELS: Record<string, { label: string; icon: string }> = {
  deposit_mpesa: { label: "M-Pesa deposit", icon: "ti-arrow-down" },
  deposit_lightning: { label: "Lightning received", icon: "ti-bolt" },
  withdrawal_mpesa: { label: "M-Pesa withdrawal", icon: "ti-arrow-up" },
  withdrawal_lightning: { label: "Lightning sent", icon: "ti-send" },
  interest_payment: { label: "Interest earned", icon: "ti-sparkles" },
  chama_contribution: { label: "Chama contribution", icon: "ti-users" },
  chama_distribution: { label: "Chama payout", icon: "ti-users" },
  agent_commission: { label: "Agent commission", icon: "ti-cash" },
  savings_lock: { label: "Locked to savings", icon: "ti-lock" },
};

export default function TransactionRow({ tx }: { tx: LedgerEntry }) {
  const rate = useRate();
  const meta = LABELS[tx.type] ?? { label: tx.type, icon: "ti-circle" };
  const credit = tx.direction === "credit";
  return (
    <div className="tx-row">
      <div className={`tx-ic ${tx.direction}`}><i className={`ti ${meta.icon}`} /></div>
      <div className="tx-meta">
        <div className="t">{meta.label}</div>
        <div className="s">
          {tx.note} · {timeAgo(tx.createdAt)}
          {tx.status !== "confirmed" && <> · <span className={`badge ${tx.status}`}>{tx.status}</span></>}
        </div>
      </div>
      <div className={`tx-amt ${tx.direction}`}>
        {credit ? "+" : "−"}{num(tx.amountSats)} sats
        <span className="sub">{fmtKES(tx.amountSats, rate)}</span>
      </div>
    </div>
  );
}
