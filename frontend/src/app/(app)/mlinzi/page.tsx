"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { num } from "@/lib/format";
import { getUser } from "@/lib/api";
import type { User } from "@/types";

import type { MlinziSection, MlinziProject, FundManagerProfile } from "@/components/app/mlinzi/types";
import MlinziSidebar from "@/components/app/mlinzi/MlinziSidebar";
import MlinziOnboardingForms from "@/components/app/mlinzi/MlinziOnboardingForms";
import MlinziProjectTracking from "@/components/app/mlinzi/MlinziProjectTracking";
import MlinziBitcoinTreasury from "@/components/app/mlinzi/MlinziBitcoinTreasury";
import MlinziVolunteerTrips from "@/components/app/mlinzi/MlinziVolunteerTrips";
import MlinziAdminWorkflow from "@/components/app/mlinzi/MlinziAdminWorkflow";

const INITIAL_PROJECTS: MlinziProject[] = [
  {
    id: "proj-1",
    name: "Mama Mboga Fresh Grocers",
    beneficiaryName: "Wanjiku Njeri",
    businessType: "Fresh Produce Duka & Distribution",
    location: "Biashara Street, Nairobi",
    fundedAmountUsd: 10_000,
    targetAmountUsd: 10_000,
    currentMonthlyRevenueUsd: 4_250,
    projectedRevenueUsd: 3_800,
    inventoryTurnover: 4.8,
    stockLevelPct: 82,
    reorderAlert: false,
    salesVsProjectionPct: 112,
    nextMilestoneDate: "Oct 15, 2026",
    posCount30d: 1_240,
    status: "active",
    visitDate: "2026-08-10",
    visitCompleted: true,
    visitReportName: "mama_mboga_inspection_verified.pdf",
    grantEligibilityScore: 94,
    proofMedia: [
      { type: "photo", title: "Cold Storage Installation", url: "#" },
      { type: "photo", title: "POS Terminal at Checkout", url: "#" },
    ],
  },
  {
    id: "proj-2",
    name: "BodaBoda Solar Swapping Station",
    beneficiaryName: "Kevin Otieno",
    businessType: "EV Battery Swapping Hub",
    location: "Kisumu Port Road",
    fundedAmountUsd: 25_000,
    targetAmountUsd: 25_000,
    currentMonthlyRevenueUsd: 6_800,
    projectedRevenueUsd: 6_500,
    inventoryTurnover: 6.2,
    stockLevelPct: 65,
    reorderAlert: false,
    salesVsProjectionPct: 105,
    nextMilestoneDate: "Nov 01, 2026",
    posCount30d: 2_150,
    status: "active",
    visitDate: "2026-08-05",
    visitCompleted: true,
    visitReportName: "bodasolar_visit_complete.pdf",
    grantEligibilityScore: 88,
    proofMedia: [
      { type: "photo", title: "Solar Inverter Array", url: "#" },
      { type: "video", title: "Rider Battery Swap Demo", url: "#" },
    ],
  },
  {
    id: "proj-3",
    name: "Kilifi Eco-Bakery & Cafe",
    beneficiaryName: "Amina Hassan",
    businessType: "Bakery & Solar Ovens",
    location: "Kilifi Creek Road",
    fundedAmountUsd: 15_000,
    targetAmountUsd: 15_000,
    currentMonthlyRevenueUsd: 3_100,
    projectedRevenueUsd: 3_500,
    inventoryTurnover: 3.5,
    stockLevelPct: 18,
    reorderAlert: true,
    salesVsProjectionPct: 89,
    nextMilestoneDate: "Sep 30, 2026",
    posCount30d: 820,
    status: "visit_scheduled",
    visitDate: "2026-09-12",
    visitCompleted: false,
    visitReportName: "",
    grantEligibilityScore: 78,
    proofMedia: [
      { type: "photo", title: "Bakery Floor Plan", url: "#" },
    ],
  },
];

const INITIAL_MANAGERS: FundManagerProfile[] = [
  {
    id: "fm-1",
    fullName: "Alexander Korir, CFA",
    country: "Kenya / UK",
    expertise: "Crypto & Bitcoin Treasury Yield",
    aumRange: "$200k – $1M",
    strategyDescription: "Delta-neutral Bitcoin basis arbitrage and lightning node routing yield generating 14-22% annualized returns with strict capital preservation.",
    trackRecordUrl: "korir_12m_verified_track.pdf",
    verifiedReturn12m: 19.4,
    status: "verified",
  },
  {
    id: "fm-2",
    fullName: "David Chen",
    country: "Singapore / East Africa",
    expertise: "Forex & Cross-Border FX Arbitrage",
    aumRange: "$1M+",
    strategyDescription: "Intraday algorithmic settlement between USD, KES, and Sats for African importers with sub-second execution and zero overnight exposure.",
    trackRecordUrl: "chen_fx_performance.pdf",
    verifiedReturn12m: 16.8,
    status: "verified",
  },
];

export default function MlinziPage() {
  const [user, setUser] = useState<User | null>(null);
  const [section, setSection] = useState<MlinziSection>("overview");
  const [projects, setProjects] = useState<MlinziProject[]>(INITIAL_PROJECTS);
  const [managers, setManagers] = useState<FundManagerProfile[]>(INITIAL_MANAGERS);

  // RULE 8.1: Early Access Gate
  const [pioneerAccessGranted, setPioneerAccessGranted] = useState(true);
  const [accessRequested, setAccessRequested] = useState(false);
  const [showNotificationList, setShowNotificationList] = useState(false);

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  const pendingApprovalsCount = projects.filter((p) => !p.visitCompleted || p.status !== "active").length;

  function handleRequestEarlyAccess() {
    setAccessRequested(true);
  }

  function handleUpdateProject(updated: MlinziProject) {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  function handleOnboardingComplete(formType: string, data: any) {
    if (formType === "beneficiary") {
      const newProj: MlinziProject = {
        id: `proj-${Date.now()}`,
        name: data.businessName || "New Enterprise",
        beneficiaryName: data.ownerName || "Applicant",
        businessType: data.businessType || "Retail",
        location: data.physicalAddress || "Kenya",
        fundedAmountUsd: parseFloat(data.fundingRequest?.replace(/[^0-9]/g, "") || "5000"),
        targetAmountUsd: parseFloat(data.fundingRequest?.replace(/[^0-9]/g, "") || "5000"),
        currentMonthlyRevenueUsd: parseFloat(data.currentMonthlyRevenue || "1200"),
        projectedRevenueUsd: parseFloat(data.currentMonthlyRevenue || "1200") * 1.3,
        inventoryTurnover: 3.0,
        stockLevelPct: 50,
        reorderAlert: false,
        salesVsProjectionPct: 100,
        nextMilestoneDate: "TBD upon audit",
        posCount30d: 0,
        status: "pending_review",
        grantEligibilityScore: 80,
        proofMedia: [],
      };
      setProjects((prev) => [newProj, ...prev]);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top Banner (Rule 8.1) */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, rgba(240, 204, 88, 0.12) 0%, rgba(28, 180, 96, 0.08) 100%)",
          border: "1px solid rgba(240, 204, 88, 0.35)",
          padding: "16px 22px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24, color: "var(--gold-text)" }}>
            <i className="ti ti-shield-check" />
          </span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold-text)" }}>
                Coming Soon · Pioneer Access
              </span>
              <span style={{ fontSize: 10, background: "var(--emerald-deep)", color: "#000", fontWeight: 700, padding: "1px 6px", borderRadius: 4 }}>
                Private Alpha
              </span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text)", marginTop: 2 }}>
              The private capital coordination hub connecting verified Investors, Beneficiary Businesses, and Fund Managers.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!pioneerAccessGranted ? (
            accessRequested ? (
              <span style={{ fontSize: 12, color: "var(--gold-text)", fontWeight: 600 }}>
                <i className="ti ti-clock" /> Request Sent (Pending Admin Review)
              </span>
            ) : (
              <Button variant="gold" onClick={handleRequestEarlyAccess}>
                Request Early Access
              </Button>
            )
          ) : (
            <span style={{ fontSize: 12, color: "var(--lime)", fontWeight: 600 }}>
              <i className="ti ti-lock-open" /> Pioneer Access Granted
            </span>
          )}

          {/* Notification Bell (Rule 8.8) */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setShowNotificationList(!showNotificationList)}
              style={{ padding: "8px 10px", position: "relative" }}
              aria-label="Approval Notifications"
            >
              <i className="ti ti-bell" style={{ fontSize: 18 }} />
              {pendingApprovalsCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "var(--red)",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {pendingApprovalsCount}
                </span>
              )}
            </button>

            {showNotificationList && (
              <div
                className="card"
                style={{
                  position: "absolute",
                  right: 0,
                  top: 44,
                  width: 320,
                  padding: "16px",
                  boxShadow: "var(--shadow-3)",
                  zIndex: 100,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <strong style={{ fontSize: 13 }}>Approval Notifications</strong>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>{pendingApprovalsCount} pending</span>
                </div>
                {projects
                  .filter((p) => !p.visitCompleted || p.status !== "active")
                  .map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSection("admin");
                        setShowNotificationList(false);
                      }}
                      style={{
                        padding: "8px",
                        borderRadius: 8,
                        background: "var(--cream)",
                        marginBottom: 6,
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ color: "var(--muted)", fontSize: 11 }}>
                        Status: {p.status.toUpperCase()} · Location: {p.location}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout with Left Sidebar (Rule 8.8) */}
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 20, alignItems: "start" }}>
        {/* Left Sidebar (Rule 8.8) */}
        <MlinziSidebar
          activeSection={section}
          onSelectSection={setSection}
          isAdmin={true}
          hasAccess={pioneerAccessGranted}
          pendingApprovalCount={pendingApprovalsCount}
        />

        {/* Main Content Area */}
        <div style={{ minWidth: 0 }}>
          {/* SECTION: Overview / Dashboard Home (Rule 8.8) */}
          {section === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* 3 Core Pillars Overview Banner (Rule 8.2) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                <div
                  className="card"
                  onClick={() => setSection("onboard-investor")}
                  style={{ padding: "18px", cursor: "pointer", transition: "transform .2s" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <i className="ti ti-coin" style={{ color: "var(--gold-text)", fontSize: 20 }} />
                    <strong style={{ fontSize: 15 }}>A. Investors &amp; Sponsors</strong>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>
                    Deploy capital for social impact or compounded real asset returns.
                  </p>
                  <span style={{ fontSize: 12, color: "var(--gold-text)", marginTop: 8, display: "block" }}>
                    Join as Investor →
                  </span>
                </div>

                <div
                  className="card"
                  onClick={() => setSection("onboard-beneficiary")}
                  style={{ padding: "18px", cursor: "pointer", transition: "transform .2s" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <i className="ti ti-building-store" style={{ color: "var(--emerald-deep)", fontSize: 20 }} />
                    <strong style={{ fontSize: 15 }}>B. Beneficiaries</strong>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>
                    Local duka shops &amp; entrepreneurs seeking seed funding and POS devices.
                  </p>
                  <span style={{ fontSize: 12, color: "var(--emerald-deep)", marginTop: 8, display: "block" }}>
                    Apply for Funding →
                  </span>
                </div>

                <div
                  className="card"
                  onClick={() => setSection("onboard-manager")}
                  style={{ padding: "18px", cursor: "pointer", transition: "transform .2s" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <i className="ti ti-chart-line" style={{ color: "var(--lime)", fontSize: 20 }} />
                    <strong style={{ fontSize: 15 }}>C. Fund Managers</strong>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>
                    Certified strategy experts managing BTC treasury and equities.
                  </p>
                  <span style={{ fontSize: 12, color: "var(--lime)", marginTop: 8, display: "block" }}>
                    Register Mandate →
                  </span>
                </div>
              </div>

              {/* Active Projects with Progress Bars (Rule 8.8) */}
              <div className="card" style={{ padding: "22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700 }}>
                      Funded Projects &amp; Progress
                    </h3>
                    <p style={{ fontSize: 12, color: "var(--muted)" }}>Real-time sales, POS telemetry, and milestone tracking.</p>
                  </div>
                  <Button variant="ghost" onClick={() => setSection("projects")} style={{ fontSize: 12 }}>
                    View Full Telemetry →
                  </Button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {projects.map((p) => {
                    const fundedPct = Math.min(100, Math.round((p.fundedAmountUsd / p.targetAmountUsd) * 100));
                    return (
                      <div
                        key={p.id}
                        style={{
                          padding: "14px",
                          background: "var(--cream)",
                          border: "1px solid var(--border-soft)",
                          borderRadius: 12,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <div>
                            <strong style={{ fontSize: 15 }}>{p.name}</strong>
                            <div style={{ fontSize: 12, color: "var(--muted)" }}>
                              {p.beneficiaryName} · {p.businessType} ({p.location})
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: 4,
                              background: p.status === "active" ? "rgba(28, 180, 96, 0.15)" : "rgba(240, 204, 88, 0.15)",
                              color: p.status === "active" ? "var(--emerald-deep)" : "var(--gold-text)",
                              fontWeight: 600,
                            }}
                          >
                            {p.status.toUpperCase()}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div style={{ marginTop: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>
                            <span>Target: ${num(p.targetAmountUsd)}</span>
                            <span style={{ fontFamily: "var(--font-mono)", color: "var(--text)", fontWeight: 600 }}>${num(p.fundedAmountUsd)} ({fundedPct}%)</span>
                          </div>
                          <div style={{ width: "100%", height: 6, background: "var(--surface)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${fundedPct}%`, height: "100%", background: "var(--gold)" }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Upcoming Physical Visit Schedule (Rule 8.8) */}
              <div className="card" style={{ padding: "22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700 }}>
                    Upcoming On-Site Physical Inspection Schedule
                  </h3>
                  <Button variant="ghost" onClick={() => setSection("admin")} style={{ fontSize: 12 }}>
                    Manage Visits →
                  </Button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                  {projects
                    .filter((p) => p.visitDate)
                    .map((p) => (
                      <div
                        key={p.id}
                        style={{
                          padding: "12px 14px",
                          background: "var(--cream)",
                          borderRadius: 10,
                          border: "1px solid var(--border-soft)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: "var(--gold-text)", fontWeight: 600 }}>
                            <i className="ti ti-calendar" /> {p.visitDate}
                          </span>
                          <span style={{ color: p.visitCompleted ? "var(--emerald-deep)" : "var(--muted)", fontSize: 11 }}>
                            {p.visitCompleted ? "Verified ✓" : "Scheduled"}
                          </span>
                        </div>
                        <strong style={{ fontSize: 13 }}>{p.name}</strong>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{p.location}</div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION: Onboarding Forms A, B, C (Rule 8.3) */}
          {section === "onboard-investor" && (
            <MlinziOnboardingForms initialForm="investor" onComplete={handleOnboardingComplete} />
          )}
          {section === "onboard-beneficiary" && (
            <MlinziOnboardingForms initialForm="beneficiary" onComplete={handleOnboardingComplete} />
          )}
          {section === "onboard-manager" && (
            <MlinziOnboardingForms initialForm="manager" onComplete={handleOnboardingComplete} />
          )}

          {/* SECTION: Projects & POS Telemetry (Rule 8.4) */}
          {(section === "projects" || section === "investments") && (
            <MlinziProjectTracking projects={projects} />
          )}

          {/* SECTION: Fund Managers (Rule 8.3) */}
          {section === "managers" && (
            <div className="card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700 }}>
                    Verified Fund Managers
                  </h2>
                  <p style={{ fontSize: 13, color: "var(--muted)" }}>Certified strategy experts managing asset allocations.</p>
                </div>
                <Button variant="gold" onClick={() => setSection("onboard-manager")}>
                  Apply as Fund Manager
                </Button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {managers.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      padding: "18px",
                      background: "var(--cream)",
                      borderRadius: 14,
                      border: "1px solid var(--border-soft)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <h4 style={{ fontSize: 16, fontWeight: 700 }}>{m.fullName}</h4>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>
                          {m.expertise} · {m.country} · AUM: {m.aumRange}
                        </div>
                      </div>
                      <span style={{ fontSize: 13, color: "var(--emerald-deep)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                        +{m.verifiedReturn12m}% 12mo Realized
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text)", marginTop: 10, lineHeight: 1.45 }}>
                      {m.strategyDescription}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION: Volunteer & Explore Trips (Rule 8.7) */}
          {section === "trips" && <MlinziVolunteerTrips />}

          {/* SECTION: Bitcoin Treasury & Fund-of-Funds (Rule 8.5) */}
          {section === "treasury" && <MlinziBitcoinTreasury />}

          {/* SECTION: Admin Panel & Physical Verification (Rule 8.6 & 8.9) */}
          {section === "admin" && (
            <MlinziAdminWorkflow projects={projects} onUpdateProject={handleUpdateProject} />
          )}
        </div>
      </div>
    </div>
  );
}
