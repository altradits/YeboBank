"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { num, fmtKESraw } from "@/lib/format";
import { getIncomeSources, getInvestorPositions, getAccessRequests, getWithdrawalRequests } from "@/lib/api";
import type { IncomeSource, InvestorPosition, AccessRequest, WithdrawalRequest } from "@/types";

export default function StewardPage() {
  const [income, setIncome] = useState<IncomeSource[]>([]);
  const [investors, setInvestors] = useState<InvestorPosition[]>([]);
  const [access, setAccess] = useState<AccessRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);

  useEffect(() => {
    getIncomeSources().then(setIncome);
    getInvestorPositions().then(setInvestors);
    getAccessRequests().then(setAccess);
    getWithdrawalRequests().then(setWithdrawals);
  }, []);

  const totalAumKes = investors.reduce((s, p) => {
    const last = p.monthlyStatements[p.monthlyStatements.length - 1];
    return s + (last ? last.closingKes : p.principalKesAtEntry);
  }, 0);
  const totalFeeKes = investors.reduce((s, p) => s + p.monthlyStatements.reduce((a, m) => a + m.feeKes, 0), 0);
  const pendingAccess = access.filter((a) => a.status === "requested").length;
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "requested" || w.status === "approved").length;

  return (
    <>
      <div className="section-head">
        <div>
          <h1 className="page-title">Mlinzi</h1>
          <p className="page-sub">Stanley Thuita · Fund Steward</p>
        </div>
      </div>

      <div className="notif-banner">
        <i className="ti ti-shield-lock" />
        <span>Friends &amp; family pilot — figures are projections, not guarantees. Not a public offer.</span>
      </div>

      <div className="grid-2">
        <div className="card"><div className="stat"><span className="l">Assets under management</span><span className="v">{fmtKESraw(totalAumKes, 0)}</span></div></div>
        <div className="card"><div className="stat"><span className="l">Fee earned (2% of profit)</span><span className="v" style={{ color: "var(--emerald-deep)" }}>{fmtKESraw(totalFeeKes, 0)}</span></div></div>
      </div>

      <div className="chama-actions" style={{ marginTop: 18 }}>
        <Link href="/steward/deploy" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-arrow-bar-up" /> Deploy capital
        </Link>
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <Link href="/steward/income" className="card" style={{ display: "block" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16 }}>Income sources</h2>
          <p className="note" style={{ marginTop: 6 }}>{income.length} stream{income.length !== 1 ? "s" : ""} tracked</p>
        </Link>
        <Link href="/steward/investors" className="card" style={{ display: "block" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16 }}>Investors</h2>
          <p className="note" style={{ marginTop: 6 }}>{investors.length} position{investors.length !== 1 ? "s" : ""}</p>
        </Link>
        <Link href="/steward/access" className="card" style={{ display: "block" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16 }}>Access requests</h2>
          <p className="note" style={{ marginTop: 6 }}>
            {pendingAccess > 0 ? <span className="badge pending">{pendingAccess} pending</span> : "All caught up"}
          </p>
        </Link>
        <Link href="/steward/withdrawals" className="card" style={{ display: "block" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16 }}>Withdrawals</h2>
          <p className="note" style={{ marginTop: 6 }}>
            {pendingWithdrawals > 0 ? <span className="badge pending">{pendingWithdrawals} in queue</span> : "All caught up"}
          </p>
        </Link>
      </div>
    </>
  );
}
