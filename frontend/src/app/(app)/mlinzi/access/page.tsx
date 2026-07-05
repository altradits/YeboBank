"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/format";
import { getAccessRequests, acceptAccess, declineAccess } from "@/lib/api";
import { ATMCard } from "@/components/app/ATMCard";
import type { AccessRequest } from "@/types";

type Relationship = "family" | "friend" | "investor";

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [accepting, setAccepting] = useState<AccessRequest | null>(null);
  const [relationship, setRelationship] = useState<Relationship>("friend");

  function load() { getAccessRequests().then(setRequests); }
  useEffect(load, []);

  async function confirmAccept() {
    if (!accepting) return;
    await acceptAccess(accepting.handle, relationship);
    setAccepting(null);
    load();
  }

  async function decline(handle: string) {
    await declineAccess(handle);
    load();
  }

  const pending = requests.filter((r) => r.status === "requested");
  const decided = requests.filter((r) => r.status !== "requested");

  const accepted = decided.filter(r => r.status === "accepted").length;
  const declined = decided.filter(r => r.status !== "accepted").length;

  return (
    <>
      <ATMCard
        variant="dashboard"
        chipLabel="MLINZI CONSOLE"
        balanceLabel="ACCESS QUEUE"
        balancePrimary={`${pending.length} pending`}
        balanceSecondary={`${requests.length} total · ${decided.length} decided`}
        stats={[
          { label: "Pending", value: `${pending.length}`, color: pending.length > 0 ? "#C9A84C" : undefined, sub: "Awaiting review" },
          { label: "Accepted", value: `${accepted}`, color: "#8ecb72", sub: "Active investors" },
          { label: "Declined", value: `${declined}`, sub: "Not invited" },
        ]}
        actions={[
          { icon: "ti-arrow-left", label: "Console", path: "/mlinzi" },
          { icon: "ti-users", label: "Investors", path: "/mlinzi/investors" },
          { icon: "ti-arrow-bar-up", label: "Deploy", path: "/mlinzi/deploy" },
          { icon: "ti-arrow-bar-down", label: "Withdrawals", path: "/mlinzi/withdrawals" },
        ]}
      />

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Pending</h2>
        {pending.length === 0 && <p className="note">No pending requests.</p>}
        {pending.map((r) => (
          <div key={r.handle} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border-soft)" }}>
            <div>
              <strong style={{ fontFamily: "var(--font-display)" }}>{r.name}</strong> <span className="note">{r.handle}</span>
              <p className="note" style={{ marginTop: 2 }}>Requested {timeAgo(r.requestedAt)}</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" style={{ padding: "8px 16px", fontSize: 13 }} onClick={() => setAccepting(r)}>Accept</button>
              <button className="btn btn-ghost" style={{ padding: "8px 16px", fontSize: 13 }} onClick={() => decline(r.handle)}>Decline</button>
            </div>
          </div>
        ))}
      </div>

      {decided.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Decided</h2>
          {decided.map((r) => (
            <div key={r.handle} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border-soft)" }}>
              <span>{r.name} <span className="note">{r.handle}</span></span>
              <span className={`badge ${r.status === "accepted" ? "confirmed" : "failed"}`}>{r.status}</span>
            </div>
          ))}
        </div>
      )}

      {accepting && (
        <div className="modal-overlay" onClick={() => setAccepting(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setAccepting(null)}>&times;</button>
            <h2>Accept {accepting.name}</h2>
            <p className="modal-sub">Choose their relationship to Mlinzi.</p>
            <select className="input" value={relationship} onChange={(e) => setRelationship(e.target.value as Relationship)}>
              <option value="family">Family</option>
              <option value="friend">Friend</option>
              <option value="investor">Investor</option>
            </select>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={confirmAccept}>Accept</button>
              <button className="btn btn-ghost" onClick={() => setAccepting(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
