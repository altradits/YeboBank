"use client";

import { useState } from "react";
import { fmtKESraw } from "@/lib/format";
import type { FIProfile } from "@/types";

export function FICalculator({ fi, currentValueKes, onSave }: { fi: FIProfile; currentValueKes: number; onSave: (p: FIProfile) => void }) {
  const [annualExpensesKes, setAnnualExpensesKes] = useState(fi.annualExpensesKes);
  const [fiRule, setFiRule] = useState(fi.fiRule);
  const [assumedReturnPctAnnual, setAssumedReturnPctAnnual] = useState(fi.assumedReturnPctAnnual);

  const fiTargetKes = fiRule > 0 ? annualExpensesKes / fiRule : 0;
  const monthlyExpenses = annualExpensesKes / 12;
  const monthlyIncomeAtCurrent = currentValueKes * (assumedReturnPctAnnual / 100) / 12;
  const coveragePct = monthlyExpenses > 0 ? (monthlyIncomeAtCurrent / monthlyExpenses) * 100 : 0;
  const monthlyReturnRate = assumedReturnPctAnnual / 100 / 12;
  // Years to FI: project current value forward, compounded monthly, until it crosses fiTargetKes.
  let years = 0;
  if (fiTargetKes > currentValueKes && monthlyReturnRate > 0) {
    const months = Math.log(fiTargetKes / Math.max(currentValueKes, 1)) / Math.log(1 + monthlyReturnRate);
    years = Math.max(0, months / 12);
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, marginBottom: 10 }}>Financial independence calculator</h2>
      <p className="note" style={{ marginBottom: 12 }}>Projection, not guarantee. Independent per person.</p>
      <div className="grid-2">
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
          Annual expenses (KES)
          <input className="input" type="number" value={annualExpensesKes} onChange={(e) => setAnnualExpensesKes(Number(e.target.value))} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
          FI rule (e.g. 0.04 → 4%)
          <input className="input" type="number" step="0.01" value={fiRule} onChange={(e) => setFiRule(Number(e.target.value))} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
          Assumed return %/yr
          <input className="input" type="number" value={assumedReturnPctAnnual} onChange={(e) => setAssumedReturnPctAnnual(Number(e.target.value))} />
        </label>
      </div>
      <button className="btn btn-ghost" style={{ marginTop: 10, padding: "8px 16px", fontSize: 13 }}
        onClick={() => onSave({ ...fi, annualExpensesKes, fiRule, assumedReturnPctAnnual })}>
        Save assumptions
      </button>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="stat"><span className="l">FI target</span><span className="v">{fmtKESraw(fiTargetKes, 0)}</span></div>
        <div className="stat"><span className="l">Coverage</span><span className="v">{coveragePct.toFixed(0)}%</span>
          <span className="note">≈{fmtKESraw(monthlyIncomeAtCurrent, 0)}/mo income vs {fmtKESraw(monthlyExpenses, 0)}/mo expenses</span></div>
      </div>
      <div className="bar-track" style={{ marginTop: 10 }}>
        <div className="bar-fill" style={{ width: `${Math.min(100, coveragePct)}%` }} />
      </div>
      <p className="note" style={{ marginTop: 10 }}>
        {years > 0 ? `≈ ${years.toFixed(1)} years to FI at current value and assumed return.` : "Already at or beyond FI target at current value."}
      </p>
    </div>
  );
}
