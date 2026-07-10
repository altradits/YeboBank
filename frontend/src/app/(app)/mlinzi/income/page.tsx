"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fmtKESraw } from "@/lib/format";
import { getIncomeSources, upsertIncomeSource, removeIncomeSource } from "@/lib/api";
import type { IncomeSource, IncomeSourceType } from "@/types";
import ChamaGrowthChart from "@/components/app/ChamaGrowthChart";
import { ATMCard } from "@/components/app/ATMCard";

const TYPE_LABEL: Record<IncomeSourceType, string> = {
  real_estate: "Real estate", govt_bond: "Govt bond", tbill: "T-bill",
  fund: "Fund", business: "Business", other: "Other",
};

const EMPTY: IncomeSource = {
  id: "", name: "", type: "real_estate", principalKes: 0,
  realizedReturnPctAnnual: 0, compounding: true, liquidity: "liquid", notes: "",
};

function IncomeContent() {
  const searchParams = useSearchParams();
  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [editing, setEditing] = useState<IncomeSource | null>(null);

  function load() { getIncomeSources().then(setSources); }
  useEffect(load, []);

  // If navigated here from Deploy Capital, open the add form pre-filled with the deployed amount.
  useEffect(() => {
    const prefilledKes = parseInt(searchParams.get("prefilledKes") ?? "0") || 0;
    if (prefilledKes > 0) {
      setEditing({ ...EMPTY, principalKes: prefilledKes });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    if (!editing) return;
    const id = editing.id || `is_${Date.now()}`;
    await upsertIncomeSource({ ...editing, id });
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    await removeIncomeSource(id);
    load();
  }

  const totalPrincipal = sources.reduce((s, x) => s + x.principalKes, 0);
  const totalAnnualIncome = sources.reduce((s, x) => s + x.principalKes * (x.realizedReturnPctAnnual / 100), 0);

  return (
    <>
      <ATMCard
        variant="dashboard"
        chipLabel="INCOME SOURCES"
        balanceLabel="TOTAL PRINCIPAL DEPLOYED"
        balancePrimary={fmtKESraw(totalPrincipal, 0)}
        balanceSecondary={`${sources.length} stream${sources.length !== 1 ? "s" : ""} · projected ${fmtKESraw(totalAnnualIncome, 0)}/yr`}
        stats={[
          { label: "Total deployed", value: fmtKESraw(totalPrincipal, 0), sub: "Capital at work" },
          { label: "Annual income", value: fmtKESraw(totalAnnualIncome, 0), color: "var(--lime)", sub: "Projected" },
          { label: "Streams", value: `${sources.length}`, sub: "Active sources" },
        ]}
        actions={[
          { icon: "ti-layout-dashboard", label: "Console",     path: "/mlinzi" },
          { icon: "ti-users",            label: "Investors",   path: "/mlinzi/investors" },
          { icon: "ti-user-check",       label: "Access",      path: "/mlinzi/access" },
          { icon: "ti-receipt",          label: "Withdrawals", path: "/mlinzi/withdrawals" },
        ]}
      />

      <div className="section-head" style={{ marginTop: 18 }}>
        <div>
          <h1 className="page-title">Income sources</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({ ...EMPTY })}>Add source</button>
      </div>

      <div className="grid-2">
        <div className="card"><div className="stat"><span className="l">Total principal deployed</span><span className="v">{fmtKESraw(totalPrincipal, 0)}</span></div></div>
        <div className="card"><div className="stat"><span className="l">Projected annual income</span><span className="v" style={{ color: "var(--emerald-deep)" }}>{fmtKESraw(totalAnnualIncome, 0)}</span></div></div>
      </div>

      {sources.length >= 2 && (
        <div className="card" style={{ marginTop: 16 }}>
          <ChamaGrowthChart
            title="Allocation by source"
            currencyMode="KES"
            series={[{
              key: "alloc", label: "Allocation",
              color: "var(--gold)",
              points: sources.map((s) => ({ label: s.name.slice(0, 10), valueSats: Math.round(s.principalKes * 7.905) })),
            }]}
          />
        </div>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        {sources.length === 0 && <p className="note">No income sources yet.</p>}
        {sources.map((s) => (
          <div key={s.id} style={{ padding: "14px 0", borderBottom: "1px solid var(--border-soft)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <strong style={{ fontFamily: "var(--font-display)" }}>{s.name}</strong>
                {" "}<span className="badge gold">{TYPE_LABEL[s.type]}</span>
                {" "}<span className={`badge ${s.liquidity === "liquid" ? "confirmed" : "pending"}`}>{s.liquidity}</span>
                <p className="note" style={{ marginTop: 6 }}>
                  {fmtKESraw(s.principalKes, 0)} principal · {s.realizedReturnPctAnnual}%/yr {s.compounding ? "compounded" : "simple"}
                  {" "}· ≈ {fmtKESraw(s.principalKes * s.realizedReturnPctAnnual / 100, 0)}/yr ({fmtKESraw(s.principalKes * s.realizedReturnPctAnnual / 100 / 12, 0)}/mo)
                </p>
                {s.notes && <p className="note" style={{ marginTop: 4 }}>{s.notes}</p>}
              </div>
              <div style={{ display: "flex", gap: 8, flex: "none" }}>
                <button className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => setEditing(s)}>Edit</button>
                <button className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => remove(s.id)}>Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setEditing(null)}>&times;</button>
            <h2>{editing.id ? "Edit" : "Add"} income source</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input className="input" placeholder="Name" value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              <select className="input" value={editing.type}
                onChange={(e) => setEditing({ ...editing, type: e.target.value as IncomeSourceType })}>
                {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <input className="input" type="number" placeholder="Principal (KES)" value={editing.principalKes || ""}
                onChange={(e) => setEditing({ ...editing, principalKes: Number(e.target.value) })} />
              <input className="input" type="number" placeholder="Realized return %/yr" value={editing.realizedReturnPctAnnual || ""}
                onChange={(e) => setEditing({ ...editing, realizedReturnPctAnnual: Number(e.target.value) })} />
              <select className="input" value={editing.liquidity}
                onChange={(e) => setEditing({ ...editing, liquidity: e.target.value as "liquid" | "illiquid" })}>
                <option value="liquid">Liquid</option>
                <option value="illiquid">Illiquid</option>
              </select>
              <label style={{ display: "flex", gap: 8, fontSize: 14, alignItems: "center" }}>
                <input type="checkbox" checked={editing.compounding}
                  onChange={(e) => setEditing({ ...editing, compounding: e.target.checked })} />
                Compounding
              </label>
              <input className="input" placeholder="Notes (optional)" value={editing.notes ?? ""}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={save}>Save</button>
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// useSearchParams() must sit under a Suspense boundary to statically export.
export default function IncomePage() {
  return (
    <Suspense>
      <IncomeContent />
    </Suspense>
  );
}
