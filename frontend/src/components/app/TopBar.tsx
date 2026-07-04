"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useRate } from "@/lib/rate-context";
import { num, maskPhone } from "@/lib/format";
import { mockUser } from "@/lib/mock";
import { logout } from "@/lib/api";

const ROLE_LABEL: Record<string, string> = {
  customer: "Member",
  agent:    "Agent",
  trader:   "Trader",
  admin:    "Admin",
  mlinzi:   "Fund Steward",
};

export function TopBar() {
  const rate     = useRate();
  const pathname = usePathname();
  const router   = useRouter();
  const initials = mockUser.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("");

  const isMlinzi  = mockUser.role === "mlinzi";
  const isAgent   = mockUser.isAgent;
  const canInvest = isMlinzi || mockUser.accessStatus === "accepted";

  // Back-link context: steward sub-pages go back to the console, not the dashboard
  const isOnDashboard    = pathname === "/dashboard";
  const isInStewardSub   = pathname.startsWith("/steward/");   // /steward/investors, /steward/access, etc.
  const isOnStewardRoot  = pathname === "/steward";
  const isOnAgentPage    = pathname === "/agent";
  const isOnInvestPage   = pathname === "/invest";

  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  function toggleTheme() {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("yebo-theme", next); } catch {}
    setDark(!dark);
    setOpen(false);
  }

  async function onLogout() {
    setOpen(false);
    await logout();
    router.push("/login");
  }

  function close() { setOpen(false); }

  // Derive the left-side element: ticker on home pages, back-link on inner pages
  const leftEl = (() => {
    if (isOnDashboard || isOnAgentPage || isOnInvestPage || isOnStewardRoot) {
      // Home pages for each role: show the live BTC rate ticker
      return (
        <div className="mini-ticker">
          <span className="pulse" /> 1 BTC = KES {num(rate.btcKes)}
        </div>
      );
    }
    if (isInStewardSub) {
      // Inside steward console sub-pages: back to console, not dashboard
      return (
        <Link href="/steward" className="topbar-back">
          <i className="ti ti-arrow-left" /> Console
        </Link>
      );
    }
    // All other inner pages: back to dashboard (personal finance hub)
    return (
      <Link href="/dashboard" className="topbar-back">
        <i className="ti ti-arrow-left" /> Dashboard
      </Link>
    );
  })();

  return (
    <div className="topbar">
      {leftEl}

      <div className="topbar-profile-wrap" ref={wrapRef}>
        {/* Theme toggle — always visible, outside dropdown */}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
        >
          <i className={`ti ${dark ? "ti-sun" : "ti-moon"}`} />
        </button>

        {/* Profile trigger */}
        <button
          className={`profile-trigger${open ? " open" : ""}`}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <span className="avatar">{initials}</span>
          <i className={`ti ti-chevron-${open ? "up" : "down"} profile-caret`} />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="profile-drop" role="menu">

            {/* ── Header ── */}
            <div className="pd-head">
              <span className="avatar avatar--lg">{initials}</span>
              <div className="pd-head-info">
                <span className="pd-name">{mockUser.fullName}</span>
                <span className="pd-phone">{maskPhone(mockUser.phone)}</span>
                <span className="pd-role-badge">{ROLE_LABEL[mockUser.role] ?? mockUser.role}</span>
              </div>
            </div>

            {/* ── Account ── */}
            <div className="pd-section">Account</div>
            <div className="pd-info-row">
              <i className="ti ti-bolt" />
              <span>{mockUser.lightningAddress}</span>
            </div>
            <div className="pd-info-row">
              <i className="ti ti-language" />
              <span>{mockUser.language === "sw" ? "Kiswahili" : "English"}</span>
            </div>

            {/* ── Role-specific links ── */}
            {isAgent && (
              <>
                <div className="pd-divider" />
                <div className="pd-section">Agent</div>
                <Link href="/agent" className="pd-item" onClick={close}>
                  <i className="ti ti-cash" /> Agent dashboard
                </Link>
              </>
            )}

            {/* F&F investor — not mlinzi, but approved to invest */}
            {canInvest && !isMlinzi && (
              <>
                <div className="pd-divider" />
                <div className="pd-section">Investments</div>
                <Link href="/invest" className="pd-item" onClick={close}>
                  <i className="ti ti-trending-up" /> Invest portal
                </Link>
              </>
            )}

            {/* Mlinzi (Fund Steward) — steward console + invest */}
            {isMlinzi && (
              <>
                <div className="pd-divider" />
                <div className="pd-section">Fund Steward</div>
                <Link href="/steward" className="pd-item" onClick={close}>
                  <i className="ti ti-shield-lock" /> Steward console
                </Link>
                <Link href="/invest" className="pd-item" onClick={close}>
                  <i className="ti ti-trending-up" /> Invest portal
                </Link>
              </>
            )}

            {/* ── Security ── */}
            <div className="pd-divider" />
            <div className="pd-section">Security</div>
            <button className="pd-item" disabled>
              <i className="ti ti-lock-password" /> Change password
            </button>
            <button className="pd-item" disabled>
              <i className="ti ti-keyframe-align-center" /> Change PIN
            </button>

            {/* ── Logout ── */}
            <div className="pd-divider" />
            <button className="pd-item pd-item--danger" onClick={onLogout}>
              <i className="ti ti-logout" /> Log out
            </button>

          </div>
        )}
      </div>
    </div>
  );
}
