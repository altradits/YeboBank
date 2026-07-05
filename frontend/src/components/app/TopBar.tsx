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
  mlinzi:   "Mlinzi",
};

export function TopBar() {
  const rate     = useRate();
  const pathname = usePathname();
  const router   = useRouter();
  const initials = mockUser.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("");

  const isMlinzi  = mockUser.role === "mlinzi";
  const isAgent   = mockUser.isAgent;
  const canInvest = isMlinzi || mockUser.accessStatus === "accepted";

  const isOnDashboard  = pathname === "/dashboard";
  const isInMlinziSub  = pathname.startsWith("/mlinzi/");
  const isOnMlinziRoot = pathname === "/mlinzi";
  const isOnAgentPage  = pathname === "/agent";
  const isOnInvestPage = pathname === "/invest";

  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

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

  const leftEl = (() => {
    if (isOnDashboard || isOnAgentPage || isOnInvestPage || isOnMlinziRoot) {
      return (
        <div className="mini-ticker">
          <span className="pulse" /> 1 BTC = KES {num(rate.btcKes)}
        </div>
      );
    }
    if (isInMlinziSub) {
      return (
        <Link href="/mlinzi" className="topbar-back">
          <i className="ti ti-layout-dashboard" /> Console
        </Link>
      );
    }
    return (
      <Link href="/dashboard" className="topbar-back">
        <i className="ti ti-layout-dashboard" /> Dashboard
      </Link>
    );
  })();

  return (
    <div className="topbar">
      {leftEl}

      <div className="topbar-profile-wrap" ref={wrapRef}>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
        >
          <i className={`ti ${dark ? "ti-sun" : "ti-moon"}`} />
        </button>

        <button
          className={`profile-trigger${open ? " open" : ""}`}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <span className="avatar">{initials}</span>
          <i className={`ti ti-chevron-${open ? "up" : "down"} profile-caret`} />
        </button>

        {open && (
          <div className="profile-drop" role="menu">

            <div className="pd-head">
              <span className="avatar avatar--lg">{initials}</span>
              <div className="pd-head-info">
                <span className="pd-name">{mockUser.fullName}</span>
                <span className="pd-phone">{maskPhone(mockUser.phone)}</span>
                <span className="pd-role-badge">{ROLE_LABEL[mockUser.role] ?? mockUser.role}</span>
              </div>
            </div>

            <div className="pd-section">Account</div>
            <div className="pd-info-row">
              <i className="ti ti-bolt" />
              <span>{mockUser.lightningAddress}</span>
            </div>
            <div className="pd-info-row">
              <i className="ti ti-language" />
              <span>{mockUser.language === "sw" ? "Kiswahili" : "English"}</span>
            </div>

            {isAgent && (
              <>
                <div className="pd-divider" />
                <div className="pd-section">Agent</div>
                <Link href="/agent" className="pd-item" onClick={close}>
                  <i className="ti ti-cash" /> Agent dashboard
                </Link>
              </>
            )}

            {canInvest && !isMlinzi && (
              <>
                <div className="pd-divider" />
                <div className="pd-section">Investments</div>
                <Link href="/invest" className="pd-item" onClick={close}>
                  <i className="ti ti-trending-up" /> Invest portal
                </Link>
              </>
            )}

            {isMlinzi && (
              <>
                <div className="pd-divider" />
                <div className="pd-section">Mlinzi</div>
                <Link href="/mlinzi" className="pd-item" onClick={close}>
                  <i className="ti ti-shield-lock" /> Mlinzi console
                </Link>
                <Link href="/invest" className="pd-item" onClick={close}>
                  <i className="ti ti-trending-up" /> Invest portal
                </Link>
              </>
            )}

            <div className="pd-divider" />
            <div className="pd-section">Security</div>
            <button className="pd-item" disabled>
              <i className="ti ti-lock-password" /> Change password
            </button>
            <button className="pd-item" disabled>
              <i className="ti ti-keyframe-align-center" /> Change PIN
            </button>

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
