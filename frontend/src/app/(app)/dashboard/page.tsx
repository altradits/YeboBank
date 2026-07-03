"use client";

import { useEffect, useState } from "react";
import { ATMCard } from "@/components/app/ATMCard";
import TransactionRow from "@/components/app/TransactionRow";
import { getWallet, getHistory, getUser } from "@/lib/api";
import type { LedgerEntry } from "@/types";

export default function DashboardPage() {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<LedgerEntry[]>([]);
  const [firstName, setFirstName] = useState("Wanjiku");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    getWallet().then((w) => setBalance(w.balanceSats));
    getHistory().then(setHistory);
    getUser().then((u) => setFirstName(u.fullName.split(" ")[0]));
  }, []);

  const shown = showAll ? history : history.slice(0, 5);

  return (
    <>
      <h1 className="page-title">Habari, {firstName} 👋</h1>
      <p className="page-sub">Here&apos;s how your money is doing today.</p>

      <div style={{ marginTop: 18 }}>
        <ATMCard sats={balance} variant="dashboard" />
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="section-head">
          <h2>Recent activity</h2>
          {history.length > 5 && (
            <button className="txtlink" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Show less" : "View all"}{" "}
              <i className={`ti ti-arrow-${showAll ? "up" : "right"}`} />
            </button>
          )}
        </div>
        {shown.map((tx) => <TransactionRow key={tx.id} tx={tx} />)}
        {history.length === 0 && <p className="note">No transactions yet. Add money to get started.</p>}
      </div>
    </>
  );
}
