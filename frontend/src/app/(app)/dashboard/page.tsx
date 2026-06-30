"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BalanceCard from "@/components/app/BalanceCard";
import TransactionRow from "@/components/app/TransactionRow";
import { getWallet, getHistory } from "@/lib/api";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import type { LedgerEntry } from "@/types";

export default function DashboardPage() {
  const rate = useRate();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    getWallet().then((w) => setBalance(w.balanceSats));
    getHistory().then(setHistory);
  }, []);

  return (
    <>
      <h1 className="page-title">Habari, Wanjiku 👋</h1>
      <p className="page-sub">Here&apos;s how your money is doing today.</p>

      <div style={{ marginTop: 24 }}>
        <BalanceCard sats={balance} />
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <div className="card">
          <div className="stat">
            <span className="l">Locked in savings</span>
            <span className="v">{num(400000)} sats</span>
          </div>
          <p className="note" style={{ marginTop: 8 }}>Earning ~5.2% target APY · ≈ KES {num(400000 * rate.kesPerSat)}</p>
        </div>
        <div className="card">
          <div className="stat">
            <span className="l">Interest earned (12 mo)</span>
            <span className="v" style={{ color: "var(--emerald-deep)" }}>+{num(52000)} sats</span>
          </div>
          <p className="note" style={{ marginTop: 8 }}>Paid monthly from real treasury yield.</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="section-head"><h2>Grow your money</h2></div>
        <p className="note" style={{ marginBottom: 14 }}>
          Pool capital with people you trust, or invest alongside Mlinzi, to grow your savings and stay ahead of inflation.
        </p>
        <div className="grid-2">
          <Link href="/chama" className="card" style={{ display: "block" }}>
            <div className="stat">
              <span className="l"><i className="ti ti-users" /> Chama</span>
              <span className="v" style={{ fontSize: 16 }}>Pool savings with a group</span>
            </div>
            <p className="note" style={{ marginTop: 8 }}>Contribute together, vote on decisions, track shared growth.</p>
          </Link>
          <Link href="/invest" className="card" style={{ display: "block" }}>
            <div className="stat">
              <span className="l"><i className="ti ti-trending-up" /> Invest with Mlinzi</span>
              <span className="v" style={{ fontSize: 16 }}>Friends &amp; family fund access</span>
            </div>
            <p className="note" style={{ marginTop: 8 }}>Request access to invest alongside Mlinzi&apos;s deployed capital.</p>
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="section-head">
          <h2>Recent activity</h2>
          <Link href="/history" className="txtlink">View all <i className="ti ti-arrow-right" /></Link>
        </div>
        {history.slice(0, 5).map((tx) => <TransactionRow key={tx.id} tx={tx} />)}
      </div>
    </>
  );
}
