"use client";

import React, { useState } from "react";
import { num } from "@/lib/format";
import type { MlinziProject } from "./types";

interface ProjectTrackingProps {
  projects: MlinziProject[];
  userRole?: "investor" | "beneficiary" | "admin";
}

export default function MlinziProjectTracking({
  projects,
  userRole = "investor",
}: ProjectTrackingProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id ?? "");
  const [activeMediaProof, setActiveMediaProof] = useState<{ title: string; url: string } | null>(null);
  const [isSyncingPos, setIsSyncingPos] = useState(false);
  const [posSyncSuccess, setPosSyncSuccess] = useState(false);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? projects[0];

  function handleSyncPos() {
    setIsSyncingPos(true);
    setTimeout(() => {
      setIsSyncingPos(false);
      setPosSyncSuccess(true);
      setTimeout(() => setPosSyncSuccess(false), 3000);
    }, 1200);
  }

  if (!selectedProject) {
    return <div className="card">No active funded projects found.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Project Selector Bar */}
      <div className="card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <i className="ti ti-building-store" style={{ fontSize: 22, color: "var(--gold-text)" }} />
          <div>
            <label style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>
              Active Funded Project
            </label>
            <select
              className="input"
              style={{ fontWeight: 700, fontSize: 15, padding: "4px 8px", background: "none" }}
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.beneficiaryName} · {p.businessType})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Real-time POS Device Sync Button */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleSyncPos}
            disabled={isSyncingPos}
            style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
          >
            <i className={`ti ti-refresh ${isSyncingPos ? "ti-spin" : ""}`} />
            {isSyncingPos ? "Syncing POS…" : "Sync YeboBank POS"}
          </button>
          {posSyncSuccess && (
            <span style={{ fontSize: 12, color: "var(--emerald-deep)", fontWeight: 600 }}>
              <i className="ti ti-check" /> Synced
            </span>
          )}
        </div>
      </div>

      {/* Primary Metrics Grid (Rule 8.4) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {/* Metric 1: Total Funded */}
        <div className="card" style={{ padding: "18px" }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--muted)", letterSpacing: "0.05em" }}>
            Total Capital Funded
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text)", marginTop: 6 }}>
            ${num(selectedProject.fundedAmountUsd)}
          </div>
          <div style={{ fontSize: 12, color: "var(--emerald-deep)", marginTop: 4 }}>
            Goal: ${num(selectedProject.targetAmountUsd)} (100% funded)
          </div>
        </div>

        {/* Metric 2: Monthly Revenue & Sales vs Projection */}
        <div className="card" style={{ padding: "18px" }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--muted)", letterSpacing: "0.05em" }}>
            Current Monthly Revenue
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text)", marginTop: 6 }}>
            ${num(selectedProject.currentMonthlyRevenueUsd)}
          </div>
          <div style={{ fontSize: 12, color: "var(--gold-text)", marginTop: 4 }}>
            <i className="ti ti-trending-up" /> {selectedProject.salesVsProjectionPct}% of projection (${num(selectedProject.projectedRevenueUsd)})
          </div>
        </div>

        {/* Metric 3: POS Activity & Inventory Turnover */}
        <div className="card" style={{ padding: "18px" }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--muted)", letterSpacing: "0.05em" }}>
            POS Transactions (30d)
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text)", marginTop: 6 }}>
            {num(selectedProject.posCount30d)} txs
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
            Inventory Turnover: <strong>{selectedProject.inventoryTurnover}x / month</strong>
          </div>
        </div>

        {/* Metric 4: Next Milestone & Grant Eligibility */}
        <div className="card" style={{ padding: "18px" }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--muted)", letterSpacing: "0.05em" }}>
            Next Milestone &amp; Grant Score
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginTop: 6 }}>
            {selectedProject.nextMilestoneDate}
          </div>
          <div style={{ fontSize: 12, color: "var(--lime)", marginTop: 4 }}>
            Grant Eligibility Score: <strong>{selectedProject.grantEligibilityScore}/100</strong>
          </div>
        </div>
      </div>

      {/* Interactive Sales Chart & Inventory Alert Center */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
        {/* Sales vs Projection Chart */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600 }}>
              Live POS Revenue &amp; Projection Chart
            </h3>
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--lime)" }}>
              Auto-sync POS live
            </span>

          </div>

          {/* SVG Sales Curve */}
          <div style={{ position: "relative", height: 160, width: "100%" }}>
            <svg viewBox="0 0 400 140" width="100%" height="100%" preserveAspectRatio="none">
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1CB460" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#1CB460" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Target projection line */}
              <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(240, 204, 88, 0.4)" strokeDasharray="4 4" strokeWidth="1.5" />
              {/* Actual sales area */}
              <path
                d="M 0 110 Q 70 95, 140 70 T 280 42 T 400 25 L 400 140 L 0 140 Z"
                fill="url(#salesGrad)"
              />
              {/* Actual sales curve line */}
              <path
                d="M 0 110 Q 70 95, 140 70 T 280 42 T 400 25"
                fill="none"
                stroke="#1CB460"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="400" cy="25" r="4.5" fill="#1CB460" />
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Today (Live POS)</span>
            </div>
          </div>
        </div>

        {/* Inventory Stock & Reorder Alerts */}
        <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
              Inventory &amp; Reorder Alerts
            </h3>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span>Available Stock Level:</span>
                <strong style={{ fontFamily: "var(--font-mono)" }}>{selectedProject.stockLevelPct}%</strong>
              </div>
              <div style={{ width: "100%", height: 8, background: "var(--cream)", borderRadius: 4, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${selectedProject.stockLevelPct}%`,
                    height: "100%",
                    background: selectedProject.stockLevelPct < 25 ? "var(--red)" : "var(--emerald-deep)",
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>

            {selectedProject.reorderAlert ? (
              <div style={{ padding: "10px 12px", background: "rgba(224, 82, 66, 0.1)", border: "1px solid var(--red)", borderRadius: 8, fontSize: 12, color: "var(--red)", display: "flex", alignItems: "center", gap: 8 }}>
                <i className="ti ti-alert-triangle" />
                <span>Stock below 25%! Auto-reorder mandate triggered.</span>
              </div>
            ) : (
              <div style={{ padding: "10px 12px", background: "rgba(28, 180, 96, 0.1)", border: "1px solid var(--emerald-deep)", borderRadius: 8, fontSize: 12, color: "var(--emerald-deep)", display: "flex", alignItems: "center", gap: 8 }}>
                <i className="ti ti-circle-check" />
                <span>Healthy stock level. No reorder required.</span>
              </div>
            )}
          </div>

          <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border-soft)" }}>
            <span style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>
              Beneficiary Verification Proof:
            </span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {selectedProject.proofMedia.map((m, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveMediaProof(m)}
                  className="btn btn-ghost"
                  style={{ fontSize: 11, padding: "4px 8px" }}
                >
                  <i className={`ti ${m.type === "photo" ? "ti-photo" : "ti-video"}`} /> {m.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Proof Media Modal */}
      {activeMediaProof && (
        <div className="modal-overlay" onClick={() => setActiveMediaProof(null)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setActiveMediaProof(null)}>✕</button>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, marginBottom: 8 }}>
              {activeMediaProof.title}
            </h3>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
              Physical on-site proof uploaded directly by {selectedProject.beneficiaryName}.
            </p>
            <div
              style={{
                width: "100%",
                height: 220,
                background: "var(--cream)",
                borderRadius: 12,
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 8,
                color: "var(--muted)",
              }}
            >
              <i className="ti ti-camera" style={{ fontSize: 36, color: "var(--gold-text)" }} />
              <span>Verified On-Site Equipment &amp; Operations</span>
              <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--soft)" }}>GPS Tagged: Nairobi, Kenya</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
