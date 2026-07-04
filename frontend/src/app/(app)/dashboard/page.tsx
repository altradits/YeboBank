"use client";

import { useEffect, useState } from "react";
import { ATMCard, type ActionItem } from "@/components/app/ATMCard";
import TransactionRow from "@/components/app/TransactionRow";
import { getWallet, getHistory, getUser } from "@/lib/api";
import { mockUser } from "@/lib/mock";
import type { LedgerEntry } from "@/types";

// Base feature buttons — every user sees these
const BASE_ACTIONS: ActionItem[] = [
  { icon: "ti-arrow-down",  label: "Add money", action: "deposit" },
  { icon: "ti-arrow-up",    label: "Withdraw",  action: "withdraw" },
  { icon: "ti-send",        label: "Send",      action: "send" },
  { icon: "ti-lock",        label: "Savings",   path: "/savings" },
  { icon: "ti-users",       label: "Chamas",    path: "/chama" },
  { icon: "ti-list",        label: "History",   path: "/history" },
];

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

  const isMlinzi  = mockUser.role === "mlinzi";
  const isAgent   = mockUser.isAgent;
  const canInvest = isMlinzi || mockUser.accessStatus === "accepted";

  const actions: ActionItem[] = [
    ...BASE_ACTIONS,
    ...(isAgent   ? [{ icon: "ti-cash",        label: "Agent",   path: "/agent" }]   : []),
    ...(canInvest ? [{ icon: "ti-trending-up", label: "Invest",  path: "/invest" }]  : []),
    ...(isMlinzi  ? [{ icon: "ti-shield-lock", label: "Console", path: "/steward" }] : []),
  ];

  const shown = showAll ? history : history.slice(0, 5);

  return (
    <>
      <h1 className="page-title">Habari, {firstName} 👋</h1>
      <p className="page-sub">Here&apos;s how your money is doing today.</p>

      <div style={{ marginTop: 18 }}>
        <ATMCard sats={balance} variant="dashboard" actions={actions} />
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
