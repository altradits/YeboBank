"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import { getAgent } from "@/lib/api";
import type { Agent } from "@/types";

export default function AgentPage() {
  const rate = useRate();
  const [agent, setAgent] = useState<Agent | null>(null);

  useEffect(() => { getAgent().then(setAgent); }, []);

  if (!agent) return <p className="note">Loading…</p>;

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
        <div className="card"><div className="stat"><span className="l">Float available</span><span className="v">{num(agent.floatLimitSats)} sats</span></div>
          <p className="note" style={{ marginTop: 8 }}>≈ KES {num(agent.floatLimitSats * rate.kesPerSat)}</p></div>
        <div className="card"><div className="stat"><span className="l">Commission earned</span><span className="v" style={{ color: "var(--emerald-deep)" }}>+{num(agent.totalEarnedSats)} sats</span></div>
          <p className="note" style={{ marginTop: 8 }}>{(agent.commissionRate * 100).toFixed(1)}% per transaction</p></div>
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <div className="card" style={{ textAlign: "center" }}>
          <i className="ti ti-arrow-down" style={{ fontSize: 30, color: "var(--emerald-deep)" }} />
          <h2 style={{ fontFamily: "var(--font-display)", marginTop: 10 }}>Accept cash</h2>
          <p className="note" style={{ marginTop: 6 }}>Take cash from a customer and credit their wallet.</p>
          <Button block style={{ marginTop: 14 }}>Cash in</Button>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <i className="ti ti-arrow-up" style={{ fontSize: 30, color: "var(--terra-text)" }} />
          <h2 style={{ fontFamily: "var(--font-display)", marginTop: 10 }}>Pay out cash</h2>
          <p className="note" style={{ marginTop: 6 }}>Give a customer cash and debit their wallet.</p>
          <Button block variant="ghost" style={{ marginTop: 14 }}>Cash out</Button>
        </div>
      </div>
    </>
  );
}
