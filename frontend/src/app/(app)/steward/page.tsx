"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { num, fmtKESraw } from "@/lib/format";
import {
  getUser, getIncomeSources, getInvestorPositions, getAccessRequests, getWithdrawalRequests,
  getMyPosition, getMlinziFIProfile, setMlinziFIProfile,
} from "@/lib/api";
import type { IncomeSource, InvestorPosition, AccessRequest, WithdrawalRequest, FIProfile, User } from "@/types";
import { FICalculator } from "@/components/app/FICalculator";

function NavCard({
  href, icon, title, count, badge, note,
}: {
  href: string;
  icon: string;
  title: string;
  count?: string;
  badge?: string;
  note?: string;
}) {
  return (
    <Link href={href} className="card" style={{ display: "block" }}>
      <div className="stat">
        <span className="l">
          <i className={`ti ${icon}`} style={{ marginRight: 7 }} />
          {title}
        </span>
        <span className="v" style={{ fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
          {count}
          {badge && <span className="badge pending">{badge}</span>}
        </span>
      </div>
      {note && <p className="note" style={{ marginTop: 8 }}>{note}</p>}
    </Link>
  );
}

export default function StewardPage() {
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

  const totalAumKes      = investors.reduce((s, p) => {
    const last = p.monthlyStatements[p.monthlyStatements.length - 1];
    return s + (last ? last.closingKes : p.principalKesAtEntry);
  }, 0);
  const totalFeeKes      = investors.reduce((s, p) => s + p.monthlyStatements.reduce((a, m) => a + m.feeKes, 0), 0);
  const pendingAccess    = access.filter((a) => a.status === "requested").length;
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "requested" || w.status === "approved").length;

  return (
    <>
      <div className="section-head">
        <div>
          <h1 className="page-title">Mlinzi Console</h1>
          <p className="page-sub">{user?.fullName ?? "—"} · Fund Steward</p>
        </div>
      </div>

      <div className="notif-banner">
        <i className="ti ti-shield-lock" />
        <span>Friends &amp; family pilot — figures are projections, not guarantees. Not a public offer.</span>
      </div>

      {/* AUM + fee summary */}
      <div className="grid-2">
        <div className="card">
          <div className="stat">
            <span className="l">Assets under management</span>
            <span className="v">{fmtKESraw(totalAumKes, 0)}</span>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            <span className="l">Fee earned (2% of profit)</span>
            <span className="v" style={{ color: "var(--emerald-deep)" }}>{fmtKESraw(totalFeeKes, 0)}</span>
          </div>
        </div>
      </div>

      {/* Primary action */}
      <div className="chama-actions" style={{ marginTop: 18 }}>
        <Link href="/steward/deploy" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-arrow-bar-up" /> Deploy capital
        </Link>
      </div>

      {/* Nav cards — styled like dashboard */}
      <div className="card" style={{ marginTop: 18 }}>
        <div className="section-head"><h2>Console</h2></div>
        <div className="grid-2" style={{ marginTop: 14 }}>
          <NavCard
            href="/steward/income"
            icon="ti-trending-up"
            title="Income sources"
            count={`${income.length} stream${income.length !== 1 ? "s" : ""} tracked`}
            note="Capital deployed to income-generating investments."
          />
          <NavCard
            href="/steward/investors"
            icon="ti-users"
            title="Investors"
            count={`${investors.length} active position${investors.length !== 1 ? "s" : ""}`}
            note="Friends &amp; family fund members and their stakes."
          />
          <NavCard
            href="/steward/access"
            icon="ti-user-check"
            title="Access requests"
            count={pendingAccess === 0 ? "All clear" : undefined}
            badge={pendingAccess > 0 ? `${pendingAccess} pending` : undefined}
            note="Approve or decline new investor access."
          />
          <NavCard
            href="/steward/withdrawals"
            icon="ti-arrow-bar-down"
            title="Withdrawals"
            count={pendingWithdrawals === 0 ? "All clear" : undefined}
            badge={pendingWithdrawals > 0 ? `${pendingWithdrawals} in queue` : undefined}
            note="Investor withdrawal requests awaiting processing."
          />
        </div>
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
