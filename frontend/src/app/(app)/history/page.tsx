"use client";

import { useEffect, useState } from "react";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import TransactionRow from "@/components/app/TransactionRow";
import { getHistory } from "@/lib/api";
import { ATMCard } from "@/components/app/ATMCard";
import type { LedgerEntry, LedgerDirection } from "@/types";

type Filter = "all" | LedgerDirection;

export default function HistoryPage() {
  const rate = useRate();
  const [history, setHistory] = useState<LedgerEntry[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => { getHistory().then(setHistory); }, []);

  const shown = history.filter((t) => filter === "all" || t.direction === filter);
  const totalIn  = history.filter(t => t.direction === "credit").reduce((s, t) => s + t.amountSats, 0);
  const totalOut = history.filter(t => t.direction === "debit").reduce((s, t) => s + t.amountSats, 0);

  return (
    <>
      <ATMCard
        variant="dashboard"
        chipLabel="HISTORY"
        balanceLabel="CURRENT BALANCE"
        stats={[
          { label: "Money in", value: `${num(totalIn)} sats`, color: "#8ecb72", sub: `≈ KES ${num(Math.round(totalIn * rate.kesPerSat))}` },
          { label: "Money out", value: `${num(totalOut)} sats`, sub: `≈ KES ${num(Math.round(totalOut * rate.kesPerSat))}` },
          { label: "Transactions", value: `${history.length}`, sub: `${history.filter(t => t.direction === "credit").length} in · ${history.filter(t => t.direction === "debit").length} out` },
        ]}
        actions={[
          { icon: "ti-arrow-down", label: "Add Money", action: "deposit" as const },
          { icon: "ti-arrow-up",   label: "Withdraw",  action: "withdraw" as const },
          { icon: "ti-send",       label: "Send",      action: "send" as const },
          { icon: "ti-piggy-bank", label: "Savings",   path: "/savings" },
        ]}
      />

      <div className="seg" style={{ marginTop: 18 }}>
        {(["all", "credit", "debit"] as Filter[]).map((f) => (
          <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f === "credit" ? "Money in" : "Money out"}
          </button>
        ))}
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        {shown.map((tx) => <TransactionRow key={tx.id} tx={tx} />)}
        {shown.length === 0 && <p className="note">No transactions yet. Add money to get started.</p>}
      </div>
    </>
  );
}
