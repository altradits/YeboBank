"use client";

import { useEffect, useState } from "react";
import TransactionRow from "@/components/app/TransactionRow";
import { getHistory } from "@/lib/api";
import type { LedgerEntry, LedgerDirection } from "@/types";

type Filter = "all" | LedgerDirection;

export default function HistoryPage() {
  const [history, setHistory] = useState<LedgerEntry[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => { getHistory().then(setHistory); }, []);

  const shown = history.filter((t) => filter === "all" || t.direction === filter);

  return (
    <>
      <h1 className="page-title">History</h1>
      <p className="page-sub">Every satoshi in and out, on the record.</p>

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
