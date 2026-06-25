"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { num, fmtKES, timeAgo } from "@/lib/format";
import { useRate } from "@/lib/rate-context";
import { getWithdrawalRequests, approveWithdrawal, declineWithdrawal } from "@/lib/api";
import type { WithdrawalRequest } from "@/types";

export default function WithdrawalsPage() {
  const rate = useRate();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [approving, setApproving] = useState<WithdrawalRequest | null>(null);
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  function load() { getWithdrawalRequests().then(setRequests); }
  useEffect(load, []);

  async function confirmApprove() {
    if (!approving || !date) return;
    await approveWithdrawal(approving.id, new Date(date).toISOString(), note || undefined);
    setApproving(null); setDate(""); setNote("");
    load();
  }

  async function decline(id: string) {
    await declineWithdrawal(id);
    load();
  }

  return (
    <>
      <div className="section-head">
        <div>
          <div style={{ marginBottom: 4 }}>
            <Link href="/steward" style={{ color: "var(--soft)", fontSize: 14 }}><i className="ti ti-arrow-left" /> Mlinzi</Link>
          </div>
          <h1 className="page-title">Withdrawal requests</h1>
        </div>
      </div>

      <p className="note" style={{ marginBottom: 14 }}>
        Deployed capital may be illiquid — approve with an expected delivery date rather than instant payout.
      </p>

      <div className="card">
        {requests.length === 0 && <p className="note">No withdrawal requests.</p>}
        {requests.map((w) => (
          <div key={w.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, padding: "14px 0", borderBottom: "1px solid var(--border-soft)" }}>
            <div>
              <strong>{w.investorHandle}</strong> requests {num(w.amountSats)} sats <span className="note">(≈ {fmtKES(w.amountSats, rate, 0)})</span>
              <p className="note" style={{ marginTop: 2 }}>
                Requested {timeAgo(w.requestedAt)} · <span className={`badge ${w.status === "delivered" ? "confirmed" : w.status === "declined" ? "failed" : "pending"}`}>{w.status}</span>
              </p>
              {w.expectedDeliveryDate && <p className="note" style={{ marginTop: 2 }}>Expected delivery: {new Date(w.expectedDeliveryDate).toLocaleDateString()}</p>}
              {w.mlinziNote && <p className="note" style={{ marginTop: 2 }}>Note: {w.mlinziNote}</p>}
            </div>
            {w.status === "requested" && (
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary" style={{ padding: "8px 16px", fontSize: 13 }} onClick={() => setApproving(w)}>Approve</button>
                <button className="btn btn-ghost" style={{ padding: "8px 16px", fontSize: 13 }} onClick={() => decline(w.id)}>Decline</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {approving && (
        <div className="modal-overlay" onClick={() => setApproving(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setApproving(null)}>&times;</button>
            <h2>Approve withdrawal — {approving.investorHandle}</h2>
            <p className="modal-sub">{num(approving.amountSats)} sats</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label className="note">Expected delivery date</label>
              <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <input className="input" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" disabled={!date} onClick={confirmApprove}>Approve</button>
              <button className="btn btn-ghost" onClick={() => setApproving(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
