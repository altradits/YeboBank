"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import SecurityTransactionGuard from "@/components/ui/SecurityTransactionGuard";
import type { MlinziProject } from "./types";
import { num } from "@/lib/format";

interface AdminWorkflowProps {
  projects: MlinziProject[];
  onUpdateProject: (updated: MlinziProject) => void;
}

export default function MlinziAdminWorkflow({
  projects,
  onUpdateProject,
}: AdminWorkflowProps) {
  const [selectedProject, setSelectedProject] = useState<MlinziProject | null>(projects[0] ?? null);
  const [visitDate, setVisitDate] = useState(selectedProject?.visitDate ?? "2026-09-15");
  const [visitCompleted, setVisitCompleted] = useState(selectedProject?.visitCompleted ?? false);
  const [reportFileName, setReportFileName] = useState(selectedProject?.visitReportName ?? "");
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  const isEligibleForApproval = visitCompleted && reportFileName.trim().length > 0;

  function handleSaveVerification() {
    if (!selectedProject) return;
    const updated: MlinziProject = {
      ...selectedProject,
      visitDate,
      visitCompleted,
      visitReportName: reportFileName || "visit_report_verified.pdf",
      status: visitCompleted ? "visit_verified" : "visit_scheduled",
    };
    setSelectedProject(updated);
    onUpdateProject(updated);
  }

  function handleConfirmDispatch() {
    if (!selectedProject) return;
    const updated: MlinziProject = {
      ...selectedProject,
      status: "funded",
    };
    setSelectedProject(updated);
    onUpdateProject(updated);
    setDispatchSuccess(true);
    setTimeout(() => {
      setDispatchSuccess(false);
      setDispatchModalOpen(false);
    }, 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Admin Panel Header */}
      <div className="card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <i className="ti ti-shield-lock" style={{ fontSize: 22, color: "var(--gold-text)" }} />
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700 }}>
                Physical Verification &amp; Final Approval Workflow (Admin Only)
              </h2>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
              Rule 8.6 Enforcement: No funds can be dispatched without a physical on-site verification visit and signed report.
            </p>
          </div>
          <span style={{ fontSize: 12, background: "rgba(240, 204, 88, 0.12)", color: "var(--gold-text)", padding: "4px 10px", borderRadius: 999, fontWeight: 600 }}>
            Admin Authorization Active
          </span>
        </div>
      </div>

      {/* Project Selector & Checklist */}
      <div className="card" style={{ padding: "24px" }}>
        <div className="field-group" style={{ marginBottom: 18 }}>
          <label>Select Project to Audit &amp; Verify</label>
          <select
            className="input"
            value={selectedProject?.id ?? ""}
            onChange={(e) => {
              const p = projects.find((proj) => proj.id === e.target.value) ?? null;
              setSelectedProject(p);
              if (p) {
                setVisitDate(p.visitDate ?? "2026-09-15");
                setVisitCompleted(p.visitCompleted ?? false);
                setReportFileName(p.visitReportName ?? "");
              }
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.beneficiaryName} ({p.location}) · Status: {p.status.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {selectedProject && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Step 1: Schedule Visit */}
            <div style={{ padding: "16px", background: "var(--cream)", borderRadius: 12, border: "1px solid var(--border-soft)" }}>
              <h4 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--gold)", color: "#000", fontSize: 12, display: "grid", placeItems: "center", fontWeight: 700 }}>1</span>
                Schedule Physical On-Site Visit
              </h4>
              <div className="grid-2">
                <div className="field-group">
                  <label>Physical Inspection Date</label>
                  <input
                    type="date"
                    className="input"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                  />
                </div>
                <div className="field-group">
                  <label>Beneficiary Location</label>
                  <input className="input" readOnly value={selectedProject.location} style={{ opacity: 0.8 }} />
                </div>
              </div>
            </div>

            {/* Step 2: Visit Completed Toggle & Report Upload */}
            <div style={{ padding: "16px", background: "var(--cream)", borderRadius: 12, border: "1px solid var(--border-soft)" }}>
              <h4 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--gold)", color: "#000", fontSize: 12, display: "grid", placeItems: "center", fontWeight: 700 }}>2</span>
                Complete Inspection &amp; Upload Report
              </h4>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <input
                  type="checkbox"
                  id="visitCompletedCheck"
                  checked={visitCompleted}
                  onChange={(e) => setVisitCompleted(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: "pointer" }}
                />
                <label htmlFor="visitCompletedCheck" style={{ fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Physical On-Site Visit Completed by Administrator
                </label>
              </div>

              <div className="field-group">
                <label>Upload Signed Physical Visit Report &amp; Photos (PDF/Images)</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg"
                  onChange={(e) => setReportFileName(e.target.files?.[0]?.name ?? "visit_report.pdf")}
                  style={{ fontSize: 13 }}
                />
                {reportFileName && (
                  <span style={{ fontSize: 12, color: "var(--emerald-deep)", marginTop: 4, display: "block" }}>
                    <i className="ti ti-file-check" /> Attached: {reportFileName}
                  </span>
                )}
              </div>

              <Button variant="ghost" onClick={handleSaveVerification} style={{ marginTop: 10 }}>
                Save Inspection Verification Status
              </Button>
            </div>

            {/* Step 3: Final Dispatch Approval */}
            <div style={{ padding: "16px", background: "var(--cream)", borderRadius: 12, border: "1px solid var(--border-soft)" }}>
              <h4 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--gold)", color: "#000", fontSize: 12, display: "grid", placeItems: "center", fontWeight: 700 }}>3</span>
                Final Capital Dispatch Authorization
              </h4>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
                Amount to dispatch: <strong style={{ color: "var(--text)" }}>${num(selectedProject.fundedAmountUsd)} USD</strong> to {selectedProject.beneficiaryName}.
              </p>

              {!isEligibleForApproval ? (
                <div style={{ padding: "10px 12px", background: "rgba(224, 82, 66, 0.08)", border: "1px solid var(--red)", borderRadius: 8, fontSize: 12, color: "var(--red)", marginBottom: 10 }}>
                  <i className="ti ti-lock" /> Final Approval locked: You must check &quot;Visit Completed&quot; and attach the Visit Report before capital can be released.
                </div>
              ) : (
                <div style={{ padding: "10px 12px", background: "rgba(28, 180, 96, 0.08)", border: "1px solid var(--emerald-deep)", borderRadius: 8, fontSize: 12, color: "var(--emerald-deep)", marginBottom: 10 }}>
                  <i className="ti ti-shield-check" /> All prerequisites met. Ready for secured dispatch authorization.
                </div>
              )}

              <Button
                variant="gold"
                disabled={!isEligibleForApproval}
                onClick={() => setDispatchModalOpen(true)}
                block
              >
                Approve &amp; Dispatch Funds (${num(selectedProject.fundedAmountUsd)})
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dispatch Security Modal (Rule 3 & Rule 5) */}
      {dispatchModalOpen && selectedProject && (
        <div className="modal-overlay" onClick={() => setDispatchModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setDispatchModalOpen(false)}>✕</button>

            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, marginBottom: 4 }}>
              Authorize Capital Dispatch
            </h3>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
              Transferring ${num(selectedProject.fundedAmountUsd)} USD seed capital to {selectedProject.beneficiaryName} ({selectedProject.name}).
            </p>

            {dispatchSuccess ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <i className="ti ti-circle-check" style={{ fontSize: 44, color: "var(--emerald-deep)" }} />
                <h4 style={{ marginTop: 8 }}>Capital Dispatched Successfully</h4>
                <p style={{ fontSize: 12, color: "var(--muted)" }}>
                  Beneficiary POS device has been activated and sales telemetry is now live.
                </p>
              </div>
            ) : (
              <SecurityTransactionGuard
                amount={selectedProject.fundedAmountUsd}
                currencyName="USD"
                onConfirm={handleConfirmDispatch}
                onClose={() => setDispatchModalOpen(false)}
                confirmLabel="Dispatch"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
