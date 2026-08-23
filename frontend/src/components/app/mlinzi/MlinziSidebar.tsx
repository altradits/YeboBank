"use client";

import React from "react";
import type { MlinziSection } from "./types";

interface SidebarProps {
  activeSection: MlinziSection;
  onSelectSection: (section: MlinziSection) => void;
  isAdmin?: boolean;
  hasAccess?: boolean;
  pendingApprovalCount?: number;
}

export default function MlinziSidebar({
  activeSection,
  onSelectSection,
  isAdmin = true,
  hasAccess = true,
  pendingApprovalCount = 2,
}: SidebarProps) {
  const navItems: { section: MlinziSection; label: string; icon: string; badge?: number; locked?: boolean }[] = [
    { section: "overview", label: "Dashboard Home", icon: "ti-layout-dashboard" },
    { section: "onboard-investor", label: "Join as Investor", icon: "ti-coin" },
    { section: "onboard-beneficiary", label: "Apply as Business", icon: "ti-building-store" },
    { section: "onboard-manager", label: "Register Fund Manager", icon: "ti-chart-line" },
    { section: "investments", label: "My Investments", icon: "ti-wallet", locked: !hasAccess },
    { section: "projects", label: "Active Projects", icon: "ti-briefcase", locked: !hasAccess },
    { section: "managers", label: "Fund Managers", icon: "ti-users", locked: !hasAccess },
    { section: "trips", label: "Volunteer Trips", icon: "ti-compass" },
    { section: "treasury", label: "Bitcoin Treasury", icon: "ti-bolt" },
  ];

  if (isAdmin) {
    navItems.push({
      section: "admin",
      label: "Admin Panel",
      icon: "ti-shield-lock",
      badge: pendingApprovalCount,
    });
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "16px",
        background: "var(--surface)",
        border: "1px solid var(--border-soft)",
        borderRadius: 16,
      }}
    >
      <div style={{ padding: "8px 10px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>
        Mlinzi Ecosystem
      </div>

      {navItems.map((item) => {
        const isActive = activeSection === item.section;
        return (
          <button
            key={item.section}
            type="button"
            onClick={() => onSelectSection(item.section)}
            disabled={item.locked}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              borderRadius: 10,
              background: isActive ? "rgba(240, 204, 88, 0.12)" : "transparent",
              color: isActive ? "var(--gold-text)" : item.locked ? "var(--soft)" : "var(--text)",
              border: isActive ? "1px solid rgba(240, 204, 88, 0.3)" : "1px solid transparent",
              fontWeight: isActive ? 600 : 500,
              fontSize: 13.5,
              cursor: item.locked ? "not-allowed" : "pointer",
              textAlign: "left",
              transition: "all 0.18s",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <i className={`ti ${item.icon}`} style={{ fontSize: 16 }} />
              {item.label}
            </span>
            {item.badge !== undefined && item.badge > 0 && (
              <span
                style={{
                  background: "var(--red)",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 999,
                  padding: "1px 6px",
                }}
              >
                {item.badge}
              </span>
            )}
            {item.locked && <i className="ti ti-lock" style={{ fontSize: 12 }} />}
          </button>
        );
      })}
    </div>
  );
}
