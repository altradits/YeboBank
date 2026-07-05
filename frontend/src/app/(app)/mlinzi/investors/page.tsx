"use client";

import { useEffect, useState } from "react";
import { num, fmtKESraw } from "@/lib/format";
import { getInvestorPositions, postMonthlyStatement } from "@/lib/api";
import { ATMCard } from "@/components/app/ATMCard";
import type { InvestorPosition } from "@/types";

export default function InvestorsPage() {
  const [positions, setPositions] = useState<InvestorPosition[]>([]);
  const [posting, setPosting] = useState<InvestorPosition | null>(null);
  const [returnKes, setReturnKes] = useState("");

  function load() { getInvestorPositions().then(setPositions); }
  useEffect(load, []);

  function closingOf(p: InvestorPosition): number {
    const last = p.monthlyStatements[p.monthlyStatements.length - 1];
    return last ? last.closingKes : p.principalKesAtEntry;
  }

  async function submitStatement() {
    if (!posting) return;
    await postMonthlyStatement(posting.id, Number(returnKes) || 0);
    setPosting(null);
    setReturnKes("");
    load();
  }

  const totalAum = positions.reduce((s, p) => s + closingOf(p), 0);
  const totalFee = positions.reduce((s, p) => s + p.monthlyStatements.reduce((a, m) => a + m.feeKes, 0), 0);

  const totalStatements = positions.reduce((s, p) => s + p.monthlyStatements.length, 0);

  return (
    <>
      <ATMCard
        variant="dashboard"
        chipLabel="INVESTORS"
        balanceLabel="TOTAL AUM"
        balancePrimary={fmtKESraw(totalAum, 0)}
        balanceSecondary={`${positions.length} position${positions.length !== 1 ? "s" : ""} · friends & family pilot`}
        stats={[
          { label: "Fee earned", value: fmtKESraw(totalFee, 0), color: "var(--lime)", sub: "2% of profit" },
          { label: "Statements", value: `${totalStatements}`, sub: "Posted monthly" },
          { label: "Avg position", value: positions.length > 0 ? fmtKESraw(totalAum / positions.length, 0) : "—", sub: "Per investor" },
        ]}
        actions={[
          { icon: "ti-layout-dashboard", label: "Console",     path: "/mlinzi" },
          { icon: "ti-user-check",       label: "Access",      path: "/mlinzi/access" },
          { icon: "ti-receipt",          label: "Withdrawals", path: "/mlinzi/withdrawals" },
          { icon: "ti-send",             label: "Deploy",      path: "/mlinzi/deploy" },
        ]}
      />

      <div className="notif-banner" style={{ marginTop: 14 }}>
        <i className="ti ti-shield-lock" />
        <span>Friends &amp; family pilot — figures are projections, not guarantees. Not a public offer.</span>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        {positions.map((p) => (
          <div key={p.id} style={{ padding: "16px 0", borderBottom: "1px solid var(--border-soft)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
              <div>
                <strong style={{ fontFamily: "var(--font-display)" }}>{p.investorName}</strong>
                {" "}<span className="badge gold">{p.relationship}</span>
                {" "}<span className="note">{p.investorHandle}</span>
                <p className="note" style={{ marginTop: 6 }}>
                  Principal {num(p.principalSats)} sats (≈ {fmtKESraw(p.principalKesAtEntry, 0)} at entry) · {p.realizedReturnPctAnnual}%/yr {p.compounding ? "compounded" : "simple"}
                </p>
                <p className="note" style={{ marginTop: 4 }}>
                  Current value <strong style={{ color: "var(--emerald-deep)" }}>{fmtKESraw(closingOf(p), 0)}</strong> · {p.monthlyStatements.length} statement{p.monthlyStatements.length !== 1 ? "s" : ""} posted
                </p>
              </div>
              <button className="btn btn-primary" style={{ padding: "9px 16px", fontSize: 13 }} onClick={() => setPosting(p)}>Post monthly statement</button>
            </div>
          </div>
        ))}
      </div>

      {posting && (
        <div className="modal-overlay" onClick={() => setPosting(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setPosting(null)}>&times;</button>
            <h2>Post statement — {posting.investorName}</h2>
            <p className="modal-sub">Opening balance {fmtKESraw(closingOf(posting), 0)}. Fee is 2% of return, only if positive.</p>
            <input className="input" type="number" placeholder="Return this month (KES)" value={returnKes}
              onChange={(e) => setReturnKes(e.target.value)} />
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={submitStatement}>Post</button>
              <button className="btn btn-ghost" onClick={() => setPosting(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
