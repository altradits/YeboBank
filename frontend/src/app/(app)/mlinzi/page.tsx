"use client";

import { useEffect, useState } from "react";
import { num, fmtKESraw } from "@/lib/format";
import {
  getUser, getIncomeSources, getInvestorPositions, getAccessRequests, getWithdrawalRequests,
  getMyPosition, getMlinziFIProfile, setMlinziFIProfile,
} from "@/lib/api";
import type { IncomeSource, InvestorPosition, AccessRequest, WithdrawalRequest, FIProfile, User } from "@/types";
import { FICalculator } from "@/components/app/FICalculator";
import { MlinziCard } from "@/components/app/MlinziCard";
import AumOverviewCards from "@/components/app/AumOverviewCards";
import MlinziQuickActions from "@/components/app/MlinziQuickActions";

export default function MlinziPage() {
  const [user,        setUser]        = useState<User | null>(null);
  const [income,      setIncome]      = useState<IncomeSource[]>([]);
  const [investors,   setInvestors]   = useState<InvestorPosition[]>([]);
  const [access,      setAccess]      = useState<AccessRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [myPosition,  setMyPosition]  = useState<InvestorPosition | null>(null);
  const [myFi,        setMyFi]        = useState<FIProfile | null>(null);

  useEffect(() => {
    getUser().then(setUser);
    getIncomeSources().then(setIncome);
    getInvestorPositions().then(setInvestors);
    getAccessRequests().then(setAccess);
    getWithdrawalRequests().then(setWithdrawals);
    getMyPosition().then(setMyPosition);
    getMlinziFIProfile().then(setMyFi);
  }, []);

  async function onSaveMyFi(p: FIProfile) {
    const saved = await setMlinziFIProfile(p);
    setMyFi(saved);
  }

  const totalAumKes = investors.reduce((s, p) => {
    const last = p.monthlyStatements[p.monthlyStatements.length - 1];
    return s + (last ? last.closingKes : p.principalKesAtEntry);
  }, 0);
  const totalFeeKes       = investors.reduce((s, p) => s + p.monthlyStatements.reduce((a, m) => a + m.feeKes, 0), 0);
  const pendingAccess      = access.filter((a) => a.status === "requested").length;
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "requested" || w.status === "approved").length;

  return (
    <>
      <div className="section-head">
        <div>
          <h1 className="page-title">Mlinzi Console</h1>
          <p className="page-sub">{user?.fullName ?? "—"} · Mlinzi</p>
        </div>
      </div>

      <div className="notif-banner">
        <i className="ti ti-shield-lock" />
        <span>Friends &amp; family pilot — figures are projections, not guarantees. Not a public offer.</span>
      </div>

      {/* AUM overview cards */}
      <AumOverviewCards
        totalAumKes={totalAumKes}
        totalAumSats={investors.reduce((s, p) => s + p.principalSats, 0)}
        incomeCount={income.length}
        investorCount={investors.length}
        feeEarnedKes={totalFeeKes}
        pendingAccess={pendingAccess}
        pendingWithdrawals={pendingWithdrawals}
      />

      {/* Quick-action grid */}
      <MlinziQuickActions
        pendingAccess={pendingAccess}
        pendingWithdrawals={pendingWithdrawals}
      />

      {/* Console card — primary navigation + stats */}
      <div style={{ marginTop: 18 }}>
        <MlinziCard
          name={user?.fullName ?? "—"}
          totalAumKes={totalAumKes}
          totalFeeKes={totalFeeKes}
          incomeCount={income.length}
          investorCount={investors.length}
          pendingAccess={pendingAccess}
          pendingWithdrawals={pendingWithdrawals}
        />
      </div>

      {/* My position */}
      {myPosition && (() => {
        const last = myPosition.monthlyStatements[myPosition.monthlyStatements.length - 1];
        const currentValueKes = last ? last.closingKes : myPosition.principalKesAtEntry;
        return (
          <div className="card" style={{ marginTop: 18 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, marginBottom: 14 }}>My position</h2>
            <div className="grid-2">
              <div className="stat">
                <span className="l">Principal</span>
                <span className="v">{num(myPosition.principalSats)} sats</span>
                <span className="note">≈ {fmtKESraw(myPosition.principalKesAtEntry, 0)} at entry</span>
              </div>
              <div className="stat">
                <span className="l">Current value</span>
                <span className="v" style={{ color: "var(--emerald-deep)" }}>{fmtKESraw(currentValueKes, 0)}</span>
              </div>
            </div>
            {myPosition.monthlyStatements.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Monthly statements</p>
                {myPosition.monthlyStatements.slice().reverse().map((m) => (
                  <div key={m.month} style={{
                    display: "flex", justifyContent: "space-between", padding: "6px 0",
                    borderBottom: "1px solid var(--border-soft)", fontSize: 13,
                  }}>
                    <span>{m.month}</span>
                    <span className="note">Open {fmtKESraw(m.openingKes, 0)}</span>
                    <span style={{ color: m.returnKes >= 0 ? "var(--emerald-deep)" : "var(--red)" }}>
                      {m.returnKes >= 0 ? "+" : ""}{fmtKESraw(m.returnKes, 0)}
                    </span>
                    <strong>{fmtKESraw(m.closingKes, 0)}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* FI calculator */}
      {myFi && (
        <FICalculator
          fi={myFi}
          currentValueKes={myPosition
            ? (myPosition.monthlyStatements.slice(-1)[0]?.closingKes ?? myPosition.principalKesAtEntry)
            : totalAumKes}
          onSave={onSaveMyFi}
        />
      )}
    </>
  );
}
