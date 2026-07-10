"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logout, getUser, getAccountSetup, saveAccountSetup } from "@/lib/api";
import type { AccountSetup } from "@/lib/mock";
import { maskPhone } from "@/lib/format";
import { roleOf, homePath, type AppRole } from "@/lib/useRoleGate";
import type { User } from "@/types";

// Every dashboard gets its OWN settings. A user only ever sees the account
// setup that belongs to their role — nothing from any other dashboard.

const ROLE_LABEL: Record<AppRole, string> = {
  member:   "Savings Member",
  agent:    "Agent",
  investor: "Friends & Family Investor",
  mlinzi:   "Mlinzi (Fund Steward)",
};

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [setup, setSetup] = useState<AccountSetup | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    getUser().then(setUser);
    getAccountSetup().then(setSetup);
  }, []);

  async function onLogout() {
    await logout();
    router.push("/login");
  }

  async function save(patch: AccountSetup) {
    setSaving(true);
    try {
      const next = await saveAccountSetup(patch);
      setSetup(next);
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2500);
    } finally {
      setSaving(false);
    }
  }

  if (!user || !setup) return <p className="note">Loading…</p>;

  const role = roleOf(user);
  const highlight = role === "member" ? undefined : role;

  return (
    <>
      <h1 className="page-title">Settings</h1>
      <p className="page-sub">Account setup for your {ROLE_LABEL[role]} dashboard.</p>

      {/* ── Profile (shared) ── */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="section-head"><h2>Profile</h2></div>
        <SettingRow label="Full name"         value={user.fullName} />
        <SettingRow label="Phone"             value={maskPhone(user.phone)} />
        <SettingRow label="Lightning address" value={user.lightningAddress} />
        <SettingRow label="Account role"      value={ROLE_LABEL[role]} highlight={highlight} />
      </div>

      {/* ── Role-specific account setup (exclusive) ── */}
      {role === "member"   && <MemberSetup   setup={setup} save={save} saving={saving} />}
      {role === "agent"    && <AgentSetup    setup={setup} save={save} saving={saving} />}
      {role === "investor" && <InvestorSetup setup={setup} save={save} saving={saving} />}
      {role === "mlinzi"   && <MlinziSetup   setup={setup} save={save} saving={saving} />}

      {savedAt && (
        <div className="notif-banner" style={{ marginTop: 12 }}>
          <i className="ti ti-circle-check" /><span>Settings saved.</span>
        </div>
      )}

      {/* ── Shortcut to the one dashboard this user owns ── */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="section-head"><h2>My dashboard</h2></div>
        <SettingLink
          icon={role === "mlinzi" ? "ti-shield-lock" : role === "agent" ? "ti-cash" : role === "investor" ? "ti-trending-up" : "ti-home"}
          label={ROLE_LABEL[role]}
          sub="This is the only dashboard your account can open."
          href={homePath(user)}
        />
      </div>

      {/* ── Security (shared) ── */}
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

// ── Role setup panels ─────────────────────────────────────────────────────────

interface SetupProps {
  setup: AccountSetup;
  save: (patch: AccountSetup) => Promise<void>;
  saving: boolean;
}

/** Member: everyday wallet setup — M-Pesa number, limits, auto-lock. */
function MemberSetup({ setup, save, saving }: SetupProps) {
  const [mpesa, setMpesa] = useState(setup.mpesaNumber ?? "");
  const [limit, setLimit] = useState(String(setup.dailyWithdrawLimitKes ?? 100000));
  const [autoLock, setAutoLock] = useState(setup.autoLockSavings ?? false);
  const [lang, setLang] = useState<"en" | "sw">(setup.language ?? "en");

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="section-head"><h2>Member account setup</h2></div>
      <p className="note" style={{ marginBottom: 14 }}>
        Setup for deposits, withdrawals, and savings on your member wallet.
      </p>
      <Field label="M-Pesa number (deposits & withdrawals)">
        <input className="input" type="tel" value={mpesa} onChange={(e) => setMpesa(e.target.value)} placeholder="+2547XX XXX XXX" />
      </Field>
      <Field label="Daily withdrawal limit (KES)">
        <input className="input" inputMode="numeric" value={limit} onChange={(e) => setLimit(e.target.value)} />
      </Field>
      <Toggle label="Auto-lock spare sats into savings each month" checked={autoLock} onChange={setAutoLock} />
      <LanguagePick value={lang} onChange={setLang} />
      <SaveButton
        saving={saving}
        onClick={() => save({
          mpesaNumber: mpesa,
          dailyWithdrawLimitKes: parseInt(limit.replace(/[^0-9]/g, ""), 10) || 0,
          autoLockSavings: autoLock,
          language: lang,
        })}
      />
    </div>
  );
}

/** Agent: till, shop, float alerts — the console's operational setup. */
function AgentSetup({ setup, save, saving }: SetupProps) {
  const [till, setTill] = useState(setup.tillNumber ?? "");
  const [shop, setShop] = useState(setup.shopName ?? "");
  const [floatAlert, setFloatAlert] = useState(String(setup.lowFloatAlertSats ?? 500000));
  const [lang, setLang] = useState<"en" | "sw">(setup.language ?? "sw");

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="section-head"><h2>Agent account setup</h2></div>
      <p className="note" style={{ marginBottom: 14 }}>
        Setup for your agent console — float, till, and cash-desk operations.
      </p>
      <Field label="M-Pesa till number">
        <input className="input" inputMode="numeric" value={till} onChange={(e) => setTill(e.target.value)} />
      </Field>
      <Field label="Shop / location name">
        <input className="input" value={shop} onChange={(e) => setShop(e.target.value)} placeholder="e.g. Otieno Electronics — Kondele" />
      </Field>
      <Field label="Low-float alert threshold (sats)">
        <input className="input" inputMode="numeric" value={floatAlert} onChange={(e) => setFloatAlert(e.target.value)} />
      </Field>
      <p className="note" style={{ marginTop: 4 }}>
        Reserve PIN, panic contacts, and reactivation codes are managed inside the{" "}
        <Link href="/agent">agent console</Link>.
      </p>
      <LanguagePick value={lang} onChange={setLang} />
      <SaveButton
        saving={saving}
        onClick={() => save({
          tillNumber: till,
          shopName: shop,
          lowFloatAlertSats: parseInt(floatAlert.replace(/[^0-9]/g, ""), 10) || 0,
          language: lang,
        })}
      />
    </div>
  );
}

/** Investor: payout details and statement preferences for the F&F programme. */
function InvestorSetup({ setup, save, saving }: SetupProps) {
  const [payout, setPayout] = useState(setup.payoutMpesaNumber ?? "");
  const [freq, setFreq] = useState<"monthly" | "quarterly">(setup.statementFrequency ?? "monthly");
  const [compound, setCompound] = useState(setup.compounding ?? true);
  const [lang, setLang] = useState<"en" | "sw">(setup.language ?? "en");

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="section-head"><h2>Investor account setup</h2></div>
      <p className="note" style={{ marginBottom: 14 }}>
        You&apos;re a verified friend/family investor in the Mlinzi programme. Payouts
        are approved personally by the Mlinzi before delivery.
      </p>
      <Field label="Payout M-Pesa number">
        <input className="input" type="tel" value={payout} onChange={(e) => setPayout(e.target.value)} placeholder="+2547XX XXX XXX" />
      </Field>
      <Field label="Statement frequency">
        <div style={{ display: "flex", gap: 8 }}>
          {(["monthly", "quarterly"] as const).map((f) => (
            <button
              key={f}
              className={`chip${freq === f ? " chip--active" : ""}`}
              style={chipStyle(freq === f)}
              onClick={() => setFreq(f)}
            >
              {f === "monthly" ? "Monthly" : "Quarterly"}
            </button>
          ))}
        </div>
      </Field>
      <Toggle label="Compound my monthly returns" checked={compound} onChange={setCompound} />
      <LanguagePick value={lang} onChange={setLang} />
      <SaveButton
        saving={saving}
        onClick={() => save({
          payoutMpesaNumber: payout,
          statementFrequency: freq,
          compounding: compound,
          language: lang,
        })}
      />
    </div>
  );
}

/** Mlinzi: steward fee, card rotation, and deployment defaults. */
function MlinziSetup({ setup, save, saving }: SetupProps) {
  const [fee, setFee] = useState(String(setup.stewardFeePct ?? 2));
  const [cvvMins, setCvvMins] = useState(String(setup.cvvRotationMins ?? 15));
  const [method, setMethod] = useState<"mpesa" | "lightning" | "card">(setup.defaultDeployMethod ?? "mpesa");
  const [lang, setLang] = useState<"en" | "sw">(setup.language ?? "en");

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="section-head"><h2>Mlinzi account setup</h2></div>
      <p className="note" style={{ marginBottom: 14 }}>
        Steward-only setup for the investment pool, virtual card, and capital deployment.
      </p>
      <Field label="Steward fee (% of positive monthly returns)">
        <input className="input" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} />
      </Field>
      <Field label="Virtual card CVV rotation (minutes)">
        <input className="input" inputMode="numeric" value={cvvMins} onChange={(e) => setCvvMins(e.target.value)} />
      </Field>
      <Field label="Default deployment method">
        <div style={{ display: "flex", gap: 8 }}>
          {([["mpesa", "M-Pesa"], ["lightning", "Lightning"], ["card", "Card"]] as const).map(([v, l]) => (
            <button key={v} style={chipStyle(method === v)} onClick={() => setMethod(v)}>{l}</button>
          ))}
        </div>
      </Field>
      <p className="note" style={{ marginTop: 4 }}>
        Investor access requests, withdrawals, and the virtual card live in the{" "}
        <Link href="/mlinzi">Mlinzi console</Link>.
      </p>
      <LanguagePick value={lang} onChange={setLang} />
      <SaveButton
        saving={saving}
        onClick={() => save({
          stewardFeePct: parseFloat(fee) || 0,
          cvvRotationMins: parseInt(cvvMins, 10) || 15,
          defaultDeployMethod: method,
          language: lang,
        })}
      />
    </div>
  );
}

// ── Shared field components ───────────────────────────────────────────────────

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: "8px 14px", borderRadius: 999, fontSize: 13, cursor: "pointer",
    fontFamily: "var(--font-display)", fontWeight: 600,
    border: `1px solid ${active ? "var(--gold)" : "var(--border-soft)"}`,
    background: active ? "color-mix(in srgb, var(--gold) 16%, transparent)" : "transparent",
    color: active ? "var(--gold-text)" : "var(--soft)",
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field-group" style={{ marginTop: 14, display: "block" }}>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, display: "block", marginBottom: 6 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, cursor: "pointer", fontSize: 14 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function LanguagePick({ value, onChange }: { value: "en" | "sw"; onChange: (v: "en" | "sw") => void }) {
  return (
    <Field label="Language">
      <div style={{ display: "flex", gap: 8 }}>
        <button style={chipStyle(value === "en")} onClick={(e) => { e.preventDefault(); onChange("en"); }}>English</button>
        <button style={chipStyle(value === "sw")} onClick={(e) => { e.preventDefault(); onChange("sw"); }}>Kiswahili</button>
      </div>
    </Field>
  );
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button
      className="settings-action-row"
      style={{ marginTop: 18, justifyContent: "center", fontWeight: 600, cursor: "pointer" }}
      onClick={onClick}
      disabled={saving}
    >
      <span className="settings-link-icon"><i className="ti ti-device-floppy" /></span>
      <span className="settings-link-label">{saving ? "Saving…" : "Save changes"}</span>
    </button>
  );
}

// ── Existing sub-components ───────────────────────────────────────────────────

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
