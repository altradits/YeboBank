"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useRate } from "@/lib/rate-context";
import { num, maskPhone } from "@/lib/format";
import { getUser, logout } from "@/lib/api";
import { roleOf, homePath, type AppRole } from "@/lib/useRoleGate";
import type { User } from "@/types";

const ROLE_LABEL: Record<AppRole, string> = {
  member:   "Member",
  agent:    "Agent",
  investor: "F&F Investor",
  mlinzi:   "Mlinzi",
};

export function TopBar() {
  const rate     = useRate();
  const pathname = usePathname();
  const router   = useRouter();

  const [user, setUser] = useState<User | null>(null);
  useEffect(() => { getUser().then(setUser); }, []);

  const role = user ? roleOf(user) : null;
  const home = user ? homePath(user) : "/dashboard";
  const initials = user ? user.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("") : "·";

  const isOnHome      = pathname === home;
  const isInMlinziSub = pathname.startsWith("/mlinzi/");

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
    if (isOnHome) {
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
    // Back always points at the signed-in user's OWN dashboard.
    return (
      <Link href={home} className="topbar-back">
        <i className="ti ti-layout-dashboard" /> {role === "agent" ? "Console" : role === "investor" ? "Portal" : "Dashboard"}
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

        {open && user && role && (
          <div className="profile-drop" role="menu">

            <div className="pd-head">
              <span className="avatar avatar--lg">{initials}</span>
              <div className="pd-head-info">
                <span className="pd-name">{user.fullName}</span>
                <span className="pd-phone">{maskPhone(user.phone)}</span>
                <span className="pd-role-badge">{ROLE_LABEL[role]}</span>
              </div>
            </div>

            <div className="pd-section">Account</div>
            <div className="pd-info-row">
              <i className="ti ti-bolt" />
              <span>{user.lightningAddress}</span>
            </div>
            <div className="pd-info-row">
              <i className="ti ti-language" />
              <span>{user.language === "sw" ? "Kiswahili" : "English"}</span>
            </div>

            {/* Exactly ONE dashboard link — the signed-in user's own. */}
            <div className="pd-divider" />
            <div className="pd-section">{ROLE_LABEL[role]}</div>
            {role === "mlinzi" && (
              <Link href="/mlinzi" className="pd-item" onClick={close}>
                <i className="ti ti-shield-lock" /> Mlinzi console
              </Link>
            )}
            {role === "agent" && (
              <Link href="/agent" className="pd-item" onClick={close}>
                <i className="ti ti-cash" /> Agent console
              </Link>
            )}
            {role === "investor" && (
              <Link href="/invest" className="pd-item" onClick={close}>
                <i className="ti ti-trending-up" /> Investor dashboard
              </Link>
            )}
            {role === "member" && (
              <Link href="/dashboard" className="pd-item" onClick={close}>
                <i className="ti ti-home" /> Dashboard
              </Link>
            )}
            <Link href="/settings" className="pd-item" onClick={close}>
              <i className="ti ti-settings" /> Account settings
            </Link>

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
