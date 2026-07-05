"use client";

import { useEffect, useState } from "react";
import { useRate } from "@/lib/rate-context";
import { num, fmtKES, fmtKESraw } from "@/lib/format";
import { FICalculator } from "@/components/app/FICalculator";
import {
  getUser, requestAccess, getMyPosition, getFIProfile, setFIProfile,
  requestWithdrawal, getIncomeSources, getMyNotifications, markRead, CBK_DECLINE_MESSAGE,
} from "@/lib/api";
import { ATMCard } from "@/components/app/ATMCard";
import type { User, InvestorPosition, FIProfile, IncomeSource, AppNotification } from "@/types";

const PILOT_BANNER = "Friends & family pilot — figures are projections, not guarantees. Not a public offer.";

export default function InvestPage() {
  const rate = useRate();
  const [user, setUser] = useState<User | null>(null);
  const [position, setPosition] = useState<InvestorPosition | null>(null);
  const [income, setIncome] = useState<IncomeSource[]>([]);
  const [fi, setFi] = useState<FIProfile | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawStatus, setWithdrawStatus] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  function load() {
    getUser().then(setUser);
  }
  useEffect(load, []);

  useEffect(() => {
    if (user?.accessStatus === "accepted") {
      getMyPosition().then(setPosition);
      getIncomeSources().then(setIncome);
      getFIProfile().then(setFi);
      getMyNotifications().then((ns) => setNotifications(ns.filter((n) => !n.read)));
    }
  }, [user?.accessStatus]);

  async function dismissNotification(id: string) {
    await markRead(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  async function onRequest() {
    await requestAccess();
    load();
  }

  async function onSubmitWithdraw() {
    const sats = Number(withdrawAmount);
    if (!sats || sats <= 0) return;
    const wr = await requestWithdrawal(sats);
    setWithdrawStatus(`Withdrawal request sent — status: ${wr.status}.`);
    setWithdrawAmount("");
  }

  async function onSaveFI(next: FIProfile) {
    const saved = await setFIProfile(next);
    setFi(saved);
  }

  if (!user) return <p className="note">Loading…</p>;

  // ── Unverified / requested ────────────────────────────────────────────────
  if (user.accessStatus === "none" || user.accessStatus === "requested") {
    return (
      <>
        <div className="section-head"><div><h1 className="page-title">Invest with Mlinzi</h1></div></div>
        <ATMCard variant="compact" />
        <div className="notif-banner"><i className="ti ti-shield-lock" /><span>{PILOT_BANNER}</span></div>
        <div className="card" style={{ textAlign: "center", padding: "40px 24px" }}>
          <i className="ti ti-lock" style={{ fontSize: 30, color: "var(--gold-text)" }} />
          <h2 style={{ fontFamily: "var(--font-display)", marginTop: 10 }}>Friends &amp; family investing</h2>
          <p className="note" style={{ marginTop: 8, maxWidth: 440, marginInline: "auto" }}>
            Mlinzi invests their own and verified family/friends&apos; capital and pays a compounded monthly
            return. Request access and Mlinzi will review you personally.
          </p>
          {user.accessStatus === "requested" ? (
            <p className="badge pending" style={{ marginTop: 18 }}>Request sent to Mlinzi for review</p>
          ) : (
            <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={onRequest}>Request access</button>
          )}
        </div>
      </>
    );
  }

  // ── Declined ───────────────────────────────────────────────────────────────
  if (user.accessStatus === "declined") {
    return (
      <>
        <div className="section-head"><div><h1 className="page-title">Invest with Mlinzi</h1></div></div>
        <ATMCard variant="compact" />
        <div className="card" style={{ textAlign: "center", padding: "40px 24px" }}>
          <i className="ti ti-building-bank" style={{ fontSize: 30, color: "var(--terra-text)" }} />
          <h2 style={{ fontFamily: "var(--font-display)", marginTop: 10 }}>Not yet, but soon</h2>
          <p className="note" style={{ marginTop: 8, maxWidth: 460, marginInline: "auto" }}>{CBK_DECLINE_MESSAGE}</p>
        </div>
      </>
    );
  }

  // ── Accepted: full investor dashboard ───────────────────────────────────────
  const last = position?.monthlyStatements[position.monthlyStatements.length - 1];
  const opening = position ? (position.monthlyStatements.length > 1 ? position.monthlyStatements[position.monthlyStatements.length - 2].closingKes : position.principalKesAtEntry) : 0;
  const currentValueKes = last ? last.closingKes : position?.principalKesAtEntry ?? 0;
  const thisMonthReturn = last ? last.returnKes : 0;

  const investSats = currentValueKes ? Math.round(currentValueKes / rate.kesPerSat) : undefined;
  const apyStr = position ? `${position.realizedReturnPctAnnual}%/yr` : "—";

  return (
    <>
      {notifications.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {notifications.map((n) => (
            <div key={n.id} className="notif-banner" style={{
              marginBottom: 8, cursor: "default",
              background: n.kind === "statement" ? "rgba(47,224,186,.08)" : undefined,
            }}>
              <i className={`ti ${n.kind === "statement" ? "ti-chart-bar" : n.kind === "access_accepted" ? "ti-circle-check" : "ti-bell"}`} />
              <span style={{ flex: 1 }}>{n.body}</span>
              <button
                onClick={() => dismissNotification(n.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--soft)", padding: "0 4px" }}
                aria-label="Dismiss"
              >
                <i className="ti ti-x" style={{ fontSize: 13 }} />
              </button>
            </div>
          ))}
        </div>
      )}
      <ATMCard
        variant="dashboard"
        chipLabel="INVESTOR"
        balanceLabel="INVESTMENT VALUE"
        sats={investSats}
        stats={[
          { label: "Principal", value: `${num(position?.principalSats ?? 0)} sats`, sub: `≈ ${fmtKESraw(position?.principalKesAtEntry ?? 0, 0)} at entry` },
          { label: "This month", value: fmtKESraw(thisMonthReturn, 0), color: thisMonthReturn >= 0 ? "var(--lime)" : undefined, sub: "Return" },
          { label: "Return rate", value: apyStr, sub: position?.compounding ? "Compounded" : "Simple" },
        ]}
        actions={[
          { icon: "ti-download",   label: "Withdraw request", onClick: () => document.getElementById("withdraw-section")?.scrollIntoView({ behavior: "smooth" }) },
          { icon: "ti-chart-bar",  label: "Statements",       onClick: () => { setShowDetails(true); setTimeout(() => document.getElementById("details-section")?.scrollIntoView({ behavior: "smooth" }), 50); } },
          { icon: "ti-calculator", label: "FI calc",          onClick: () => { setShowDetails(true); setTimeout(() => document.getElementById("details-section")?.scrollIntoView({ behavior: "smooth" }), 50); } },
        ]}
      />
      <div className="notif-banner" style={{ marginTop: 14 }}><i className="ti ti-shield-lock" /><span>{PILOT_BANNER}</span></div>
      {user.relationship && user.relationship !== "none" && (
        <p className="page-sub" style={{ marginTop: 6 }}>{user.relationship} of Mlinzi</p>
      )}

      {/* Primary action: request withdrawal */}
      <div id="withdraw-section" className="card" style={{ marginTop: 14 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Request withdrawal</h2>
        <p className="note" style={{ marginBottom: 12 }}>No self-service payout — Mlinzi approves and sets an expected delivery date.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <input className="input" type="text" inputMode="numeric" placeholder="Amount (sats)" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
          <button className="btn btn-primary" onClick={onSubmitWithdraw}>Request</button>
        </div>
        {withdrawAmount && <p className="note" style={{ marginTop: 6 }}>≈ {fmtKES(Number(withdrawAmount) || 0, rate, 0)}</p>}
        {withdrawStatus && <p className="note" style={{ marginTop: 10, color: "var(--emerald-deep)" }}>{withdrawStatus}</p>}
      </div>

      {/* Details toggle */}
      <button
        onClick={() => setShowDetails((v) => !v)}
        style={{
          marginTop: 14, width: "100%", background: "none",
          border: "1px solid var(--border-soft)", borderRadius: "var(--r-sm)",
          padding: "10px 16px", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "space-between",
          color: "var(--soft)", fontSize: 13,
        }}
      >
        <span><i className="ti ti-chart-bar" style={{ marginRight: 8 }} />Performance, statements &amp; FI planner</span>
        <i className={`ti ti-chevron-${showDetails ? "up" : "down"}`} />
      </button>

      {showDetails && (
        <div id="details-section" style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Performance detail */}
          <div className="card">
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, marginBottom: 14 }}>Performance detail</h2>
            <div className="grid-2">
              <div className="stat">
                <span className="l">Current value</span>
                <span className="v" style={{ color: "var(--emerald-deep)" }}>{fmtKESraw(currentValueKes, 0)}</span>
                <span className="note">on opening {fmtKESraw(opening, 0)}</span>
              </div>
              <div className="stat">
                <span className="l">Realized return</span>
                <span className="v">{position?.realizedReturnPctAnnual ?? 0}%/yr</span>
                <span className="note">{position?.compounding ? "compounded monthly" : "simple"} — projection, not guarantee</span>
              </div>
            </div>
          </div>

          {/* What your capital is exposed to */}
          {income.length > 0 && (
            <div className="card">
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, marginBottom: 10 }}>What Mlinzi has invested in</h2>
              {income.map((s) => (
                <div key={s.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border-soft)" }}>
                  <strong>{s.name}</strong> <span className="note">— {s.realizedReturnPctAnnual}%/yr, {s.liquidity}</span>
                </div>
              ))}
            </div>
          )}

          {/* Monthly statements */}
          <div className="card">
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, marginBottom: 10 }}>Monthly statements</h2>
            {(!position || position.monthlyStatements.length === 0) && <p className="note">No statements posted yet.</p>}
            <div style={{ overflowX: "auto" }}>
              {position?.monthlyStatements.slice().reverse().map((m) => (
                <div key={m.month} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "8px 0", borderBottom: "1px solid var(--border-soft)", fontSize: 13, minWidth: 480 }}>
                  <span style={{ flex: "0 0 72px" }}>{m.month}</span>
                  <span className="note">Open {fmtKESraw(m.openingKes, 0)}</span>
                  <span style={{ color: m.returnKes >= 0 ? "var(--emerald-deep)" : "var(--red)" }}>{m.returnKes >= 0 ? "+" : ""}{fmtKESraw(m.returnKes, 0)}</span>
                  <span className="note">Fee {fmtKESraw(m.feeKes, 0)}</span>
                  <strong>{fmtKESraw(m.closingKes, 0)}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* FI calculator */}
          {fi && <FICalculator fi={fi} currentValueKes={currentValueKes} onSave={onSaveFI} />}
        </div>
      )}
    </>
  );
}
