"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import TransactionRow from "@/components/app/TransactionRow";
import { useRate } from "@/lib/rate-context";
import { num, fmtKESraw } from "@/lib/format";
import { getAgent, getAgentHistory, agentCashTransact } from "@/lib/api";
import type { Agent, LedgerEntry } from "@/types";

const LOW_FLOAT_THRESHOLD = 2_000_000;

export default function AgentPage() {
  const rate = useRate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [history, setHistory] = useState<LedgerEntry[]>([]);
  const [acting, setActing] = useState<"in" | "out" | null>(null);
  const [phone, setPhone] = useState("");
  const [kes, setKes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    getAgent().then(setAgent);
    getAgentHistory().then(setHistory);
  }
  useEffect(load, []);

  async function submitCash() {
    if (!acting || !phone || !kes) return;
    setSubmitting(true);
    const amountSats = Math.round((Number(kes) || 0) / rate.kesPerSat);
    await agentCashTransact(acting, phone, amountSats);
    setSubmitting(false);
    setActing(null); setPhone(""); setKes("");
    load();
  }

  if (!agent) return <p className="note">Loading…</p>;

  const lowFloat = agent.floatLimitSats < LOW_FLOAT_THRESHOLD;

  return (
    <>
      <div className="section-head">
        <div>
          <h1 className="page-title">Agent</h1>
          <p className="page-sub">{agent.locationName}</p>
        </div>
        <span className="badge agent">{agent.status}</span>
      </div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="stat"><span className="l">Float available</span><span className="v">{num(agent.floatLimitSats)} sats</span></div>
          <p className="note" style={{ marginTop: 8 }}>≈ KES {num(agent.floatLimitSats * rate.kesPerSat)}</p>
          {lowFloat && (
            <p className="note" style={{ marginTop: 6, color: "var(--terra-text)" }}>
              <i className="ti ti-alert-triangle" /> Float is running low — top up to keep serving cash-in requests.
            </p>
          )}
        </div>
        <div className="card">
          <div className="stat"><span className="l">Commission earned</span><span className="v" style={{ color: "var(--emerald-deep)" }}>+{num(agent.totalEarnedSats)} sats</span></div>
          <p className="note" style={{ marginTop: 8 }}>{(agent.commissionRate * 100).toFixed(1)}% per transaction · held in sats, protected from KES inflation</p>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <div className="card" style={{ textAlign: "center" }}>
          <i className="ti ti-arrow-down" style={{ fontSize: 30, color: "var(--emerald-deep)" }} />
          <h2 style={{ fontFamily: "var(--font-display)", marginTop: 10 }}>Accept cash</h2>
          <p className="note" style={{ marginTop: 6 }}>Take cash from a customer and credit their wallet.</p>
          <Button block style={{ marginTop: 14 }} onClick={() => setActing("in")}>Cash in</Button>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <i className="ti ti-arrow-up" style={{ fontSize: 30, color: "var(--terra-text)" }} />
          <h2 style={{ fontFamily: "var(--font-display)", marginTop: 10 }}>Pay out cash</h2>
          <p className="note" style={{ marginTop: 6 }}>Give a customer cash and debit their wallet.</p>
          <Button block variant="ghost" style={{ marginTop: 14 }} onClick={() => setActing("out")}>Cash out</Button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="section-head"><h2>Recent activity</h2></div>
        {history.length === 0 && <p className="note">No transactions yet today.</p>}
        {history.slice(0, 8).map((tx) => <TransactionRow key={tx.id} tx={tx} />)}
      </div>

      {acting && (
        <div className="modal-overlay" onClick={() => setActing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setActing(null)}>&times;</button>
            <h2>{acting === "in" ? "Cash in" : "Cash out"} — customer</h2>
            <p className="modal-sub">
              {acting === "in" ? "Enter the customer's phone and the cash you received." : "Enter the customer's phone and the cash you're paying out."}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input className="input" placeholder="Customer phone (+254...)" value={phone}
                onChange={(e) => setPhone(e.target.value)} />
              <input className="input" type="number" placeholder="Amount (KES)" value={kes}
                onChange={(e) => setKes(e.target.value)} />
              {kes && <p className="note">≈ {num(Math.round((Number(kes) || 0) / rate.kesPerSat))} sats · commission ≈ {fmtKESraw((Number(kes) || 0) * agent.commissionRate, 0)}</p>}
            </div>
            <div className="modal-actions">
              <Button disabled={!phone || !kes || submitting} onClick={submitCash}>
                {submitting ? "Processing…" : `Confirm ${acting === "in" ? "cash in" : "cash out"}`}
              </Button>
              <Button variant="ghost" onClick={() => setActing(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
