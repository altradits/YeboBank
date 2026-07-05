"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logout, getUser } from "@/lib/api";
import { maskPhone } from "@/lib/format";
import type { User } from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => { getUser().then(setUser); }, []);

  async function onLogout() {
    await logout();
    router.push("/login");
  }

  if (!user) return <p className="note">Loading…</p>;

  const isMlinzi  = user.role === "mlinzi";
  const isAgent   = user.isAgent;
  const canInvest = isMlinzi || user.accessStatus === "accepted";
  const isFF      = canInvest && !isMlinzi;

  const ROLE_LABEL: Record<string, string> = {
    customer: "Savings Member",
    agent:    "Agent",
    mlinzi:   "Mlinzi",
  };

  return (
    <>
      <h1 className="page-title">Settings</h1>
      <p className="page-sub">Your account, role, and preferences.</p>

      {/* ── Profile ── */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="section-head"><h2>Profile</h2></div>
        <SettingRow label="Full name"        value={user.fullName} />
        <SettingRow label="Phone"            value={maskPhone(user.phone)} />
        <SettingRow label="Lightning address" value={user.lightningAddress} />
        <SettingRow label="Language"         value={user.language === "sw" ? "Kiswahili" : "English"} />
        <SettingRow label="Account role"     value={ROLE_LABEL[user.role] ?? user.role}
          highlight={isMlinzi ? "mlinzi" : isFF ? "investor" : isAgent ? "agent" : undefined} />
      </div>

      {/* ── Agent-specific tools ── */}
      {isAgent && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="section-head"><h2>Agent tools</h2></div>
          <p className="note" style={{ marginBottom: 14 }}>
            You are a registered YeboBank agent. Manage your float and transactions from the agent console.
          </p>
          <SettingLink
            icon="ti-cash"
            label="Agent dashboard"
            sub="Float, commissions, and cash transactions"
            href="/agent"
          />
        </div>
      )}

      {/* ── F&F investor tools ── */}
      {isFF && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="section-head"><h2>Investments</h2></div>
          <p className="note" style={{ marginBottom: 14 }}>
            You have approved access to the Friends &amp; Family investment programme.
          </p>
          <SettingLink
            icon="ti-trending-up"
            label="Invest portal"
            sub="Your position, returns, and withdrawal requests"
            href="/invest"
          />
        </div>
      )}

      {/* ── Mlinzi tools ── */}
      {isMlinzi && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="section-head"><h2>Mlinzi</h2></div>
          <p className="note" style={{ marginBottom: 14 }}>
            You are Mlinzi. You manage the investment pool, investor access, and capital deployment.
          </p>
          <SettingLink
            icon="ti-shield-lock"
            label="Mlinzi console"
            sub="Investors, income sources, pool deployments, virtual card"
            href="/mlinzi"
          />
          <SettingLink
            icon="ti-trending-up"
            label="Invest portal"
            sub="Your own position and FI projections"
            href="/invest"
          />
        </div>
      )}

      {/* ── Security ── */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="section-head"><h2>Security</h2></div>
        <p className="note" style={{ marginBottom: 14 }}>
          Password and PIN changes are available once the backend is live.
        </p>
        <SettingAction icon="ti-lock-password" label="Change password" disabled />
        <SettingAction icon="ti-keyframe-align-center" label="Change transaction PIN" disabled />
      </div>

      {/* ── Logout ── */}
      <div className="card" style={{ marginTop: 16 }}>
        <button className="settings-danger-row" onClick={onLogout}>
          <i className="ti ti-logout" />
          <div>
            <div className="settings-danger-label">Log out</div>
            <div className="settings-danger-sub">You will return to the sign-in screen.</div>
          </div>
        </button>
      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SettingRow({
  label, value, highlight,
}: {
  label: string;
  value: string;
  highlight?: "agent" | "investor" | "mlinzi";
}) {
  const colorMap = { agent: "var(--gold)", investor: "var(--lime)", mlinzi: "var(--emerald-deep)" };
  return (
    <div className="tx-row" style={{ justifyContent: "space-between", padding: "10px 0" }}>
      <span className="note">{label}</span>
      <span style={{
        fontFamily: "var(--font-display)", fontWeight: 600,
        color: highlight ? colorMap[highlight] : "var(--text)",
      }}>
        {value}
      </span>
    </div>
  );
}

function SettingLink({ icon, label, sub, href }: { icon: string; label: string; sub: string; href: string }) {
  return (
    <Link href={href} className="settings-link-row">
      <span className="settings-link-icon"><i className={`ti ${icon}`} /></span>
      <div className="settings-link-body">
        <span className="settings-link-label">{label}</span>
        <span className="settings-link-sub">{sub}</span>
      </div>
      <i className="ti ti-chevron-right settings-link-arrow" />
    </Link>
  );
}

function SettingAction({ icon, label, disabled }: { icon: string; label: string; disabled?: boolean }) {
  return (
    <button className="settings-action-row" disabled={disabled}>
      <span className="settings-link-icon"><i className={`ti ${icon}`} /></span>
      <span className="settings-link-label">{label}</span>
      {disabled && <span className="settings-soon">Soon</span>}
    </button>
  );
}
