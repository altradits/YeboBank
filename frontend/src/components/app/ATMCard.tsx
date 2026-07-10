"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import { getWallet, getUser } from "@/lib/api";
import QuickActionModal, { type QuickActionKind } from "@/components/app/QuickActionModal";

const LAST4  = "2370";
const EXPIRY = "12/29";
const BG     = "linear-gradient(135deg, #050A06 0%, #0A2016 50%, #1C1200 100%)";

export interface StatItem {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

export interface ActionItem {
  icon: string;
  label: string;
  path?: string;
  action?: QuickActionKind;
  onClick?: () => void;
  badge?: number;
}

export type { QuickActionKind };

interface Props {
  /** Pre-loaded balance in sats. If omitted the component fetches it. */
  sats?: number;
  /**
   * "dashboard" — full-width financial overview panel (main dashboard)
   * "full"      — physical ATM/debit card face (transactional pages: deposit, withdraw, send)
   * "compact"   — slim horizontal identity strip (sub-dashboards: savings, chama, history)
   */
  variant?: "dashboard" | "full" | "compact";
  /**
   * Custom label for the balance display.
   * Defaults to "AVAILABLE BALANCE". Each page passes its contextually relevant label.
   */
  balanceLabel?: string;
  /** Override the chip tag text (default "SAVINGS ACCOUNT"). */
  chipLabel?: string;
  /** Override the entire primary balance line (hides KES/sats toggle when set). */
  balancePrimary?: string;
  /** Override the secondary balance line. */
  balanceSecondary?: string;
  /**
   * Dashboard variant: locked sats and interest earned to show in the summary strip.
   * Defaults match mock data.
   */
  lockedSats?: number;
  earnedSats?: number;
  /** Custom stats strip items (overrides defaults when provided). */
  stats?: StatItem[];
  /** Custom action buttons (overrides defaults when provided). */
  actions?: ActionItem[];
}

// ── Shared sub-components ─────────────────────────────────────────────────────
function Chip({ small }: { small?: boolean }) {
  const w = small ? 28 : 40, h = small ? 20 : 30;
  return (
    <div style={{
      width: w, height: h, borderRadius: 5, flexShrink: 0,
      background: "linear-gradient(135deg, #C9A84C 0%, #EDD06E 50%, #A07830 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 2px 8px rgba(0,0,0,.4)",
    }}>
      <div style={{
        width: w - 10, height: h - 6, borderRadius: 3,
        border: "1px solid rgba(0,0,0,.25)",
        display: "flex", flexDirection: "column", justifyContent: "center",
        gap: 3, padding: "0 3px",
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ height: 1, background: "rgba(0,0,0,.2)" }} />
        ))}
      </div>
    </div>
  );
}

function Arcs({ sizes = [7, 11, 15] }: { sizes?: number[] }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 3, alignItems: "center" }}>
      {sizes.map(s => (
        <div key={s} style={{
          width: s, height: s, borderRadius: "50%",
          border: "1.5px solid rgba(255,255,255,.45)",
          borderLeftColor: "transparent",
          transform: "rotate(-45deg)",
        }} />
      ))}
    </div>
  );
}

function BalanceToggle({ view, onChange }: { view: "kes" | "sats"; onChange: (v: "kes" | "sats") => void }) {
  return (
    <div style={{
      display: "inline-flex", background: "rgba(255,255,255,.08)",
      border: "1px solid rgba(255,255,255,.1)", borderRadius: 999, padding: 3, gap: 2,
    }}>
      {(["kes", "sats"] as const).map(v => (
        <button key={v} onClick={() => onChange(v)} style={{
          fontFamily: "var(--font-mono)", fontSize: 10, border: "none", cursor: "pointer",
          padding: "3px 11px", borderRadius: 999,
          background: view === v ? "#C9A84C" : "transparent",
          color: view === v ? "#3a2c00" : "rgba(255,255,255,.6)",
          fontWeight: view === v ? 700 : 400,
          transition: "background .15s, color .15s",
        }}>{v.toUpperCase()}</button>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function ATMCard({
  sats: propSats,
  variant = "full",
  balanceLabel = "AVAILABLE BALANCE",
  chipLabel,
  balancePrimary: customPrimary,
  balanceSecondary: customSecondary,
  lockedSats = 400_000,
  earnedSats = 52_000,
  stats,
  actions,
}: Props) {
  const rate   = useRate();
  const router = useRouter();

  const [walletSats, setWalletSats] = useState<number | null>(null);
  const [name,       setName]       = useState("—");
  const [view,       setView]       = useState<"kes" | "sats">("kes");
  const [quickAction, setQuickAction] = useState<QuickActionKind | null>(null);

  useEffect(() => {
    if (propSats === undefined) getWallet().then(w => setWalletSats(w.balanceSats));
    getUser().then(u => setName(u.fullName.toUpperCase()));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (propSats !== undefined) setWalletSats(propSats); }, [propSats]);

  const sats = walletSats ?? propSats ?? null;

  const balPrimary   = sats === null ? "···"
    : view === "kes" ? `KES ${num(sats * rate.kesPerSat, 2)}`
    : `${num(sats)} SATS`;

  const balSecondary = sats === null ? ""
    : view === "kes" ? `≈ ${num(sats)} sats`
    : `≈ KES ${num(sats * rate.kesPerSat, 2)}`;

  const sharedBg = {
    background: BG,
    color: "white" as const,
    position: "relative" as const,
    overflow: "hidden" as const,
  };

  // ── DASHBOARD variant ────────────────────────────────────────────────────────
  if (variant === "dashboard") {
    const defaultStats: StatItem[] = [
      { label: "Locked in savings", value: `${num(lockedSats)} sats`, sub: `≈ KES ${num(lockedSats * rate.kesPerSat)}` },
      { label: "Interest earned (12 mo)", value: `+${num(earnedSats)} sats`, sub: "Paid monthly", color: "var(--lime)" },
      { label: "Target APY", value: "~5.2%", sub: "From real yield" },
    ];
    const defaultActions: ActionItem[] = [
      { icon: "ti-arrow-down", label: "Add money", action: "deposit" },
      { icon: "ti-arrow-up",   label: "Withdraw",  action: "withdraw" },
      { icon: "ti-send",       label: "Send",      action: "send" },
      { icon: "ti-lock",       label: "Lock",      action: "lock" },
    ];
    const displayStats   = stats   ?? defaultStats;
    const displayActions = actions ?? defaultActions;

    return (
      <>
      <div style={{ ...sharedBg, borderRadius: 18, padding: "24px 28px", boxShadow: "0 14px 44px rgba(0,0,0,.5)" }}>
        {/* Glow orbs */}
        <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,.2) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(28,58,107,.3) 0%, transparent 70%)", pointerEvents: "none" }} />

        {/* Top row: brand + name */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, letterSpacing: 1 }}>
              YeboBank
            </span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,.35)", letterSpacing: 2, border: "1px solid rgba(255,255,255,.12)", borderRadius: 4, padding: "2px 7px" }}>
              {(chipLabel ?? "SAVINGS ACCOUNT").toUpperCase()}
            </span>
          </div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,.45)", letterSpacing: 1 }}>{name}</p>
        </div>

        {/* Balance */}
        <div style={{ marginTop: 22, position: "relative" }}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,.38)", letterSpacing: 2.5, marginBottom: 6 }}>{balanceLabel}</p>
          {customPrimary ? (
            <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "clamp(26px, 6vw, 36px)", letterSpacing: -.5, lineHeight: 1 }}>
              {customPrimary}
            </p>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 14, flexWrap: "wrap" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "clamp(26px, 6vw, 36px)", letterSpacing: -.5, lineHeight: 1 }}>
                {balPrimary}
              </p>
              <BalanceToggle view={view} onChange={setView} />
            </div>
          )}
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,255,255,.4)", marginTop: 5 }}>
            {customSecondary ?? balSecondary}
          </p>
        </div>

        {/* Summary stats strip */}
        <div style={{
          display: "grid", gridTemplateColumns: `repeat(${displayStats.length}, 1fr)`,
          gap: 0, marginTop: 22,
          borderTop: "1px solid rgba(255,255,255,.09)",
          borderBottom: "1px solid rgba(255,255,255,.09)",
          paddingBlock: 14,
        }}>
          {displayStats.map((s, i, arr) => (
            <div key={s.label} style={{
              padding: "0 16px",
              borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,.08)" : "none",
            }}>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,.38)", letterSpacing: 1.5, marginBottom: 5 }}>{s.label.toUpperCase()}</p>
              <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: s.color ?? "white" }}>{s.value}</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,.35)", marginTop: 3 }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Quick actions — columns adapt to item count so the grid never has orphan cells */}
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${displayActions.length <= 4 ? displayActions.length : displayActions.length <= 6 ? Math.ceil(displayActions.length / 2) : 4}, 1fr)`,
          gap: 8, marginTop: 16,
        }}>
          {displayActions.map((a) => (
            <button
              key={a.label}
              onClick={
                a.action ? () => setQuickAction(a.action!)
                : a.path ? () => router.push(a.path!)
                : a.onClick
              }
              style={{
              background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)",
              color: "#fff", borderRadius: 12, padding: "12px 6px",
              fontSize: 12, fontWeight: 500, cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
              transition: "background .2s, transform .2s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.15)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.07)"; (e.currentTarget as HTMLElement).style.transform = ""; }}
            >
              <div style={{ position: "relative" }}>
                <i className={`ti ${a.icon}`} style={{ color: "var(--lime)", fontSize: 20 }} />
                {!!a.badge && (
                  <span style={{
                    position: "absolute", top: -4, right: -8,
                    background: "#C9A84C", color: "#3a2c00",
                    fontSize: 9, fontWeight: 700, fontFamily: "var(--font-mono)",
                    borderRadius: 999, minWidth: 15, height: 15,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 3px",
                  }}>
                    {a.badge}
                  </span>
                )}
              </div>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {quickAction && (
        <QuickActionModal kind={quickAction} onClose={() => setQuickAction(null)} />
      )}
      </>
    );
  }

  // ── COMPACT variant ──────────────────────────────────────────────────────────
  if (variant === "compact") {
    return (
      <div style={{ ...sharedBg, borderRadius: 14, padding: "14px 20px", boxShadow: "0 6px 24px rgba(0,0,0,.35)", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 130, height: 130, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,.2) 0%, transparent 70%)", pointerEvents: "none" }} />

        {/* Logo + chip */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, letterSpacing: 1 }}>
            YeboBank
          </span>
          <Chip small />
        </div>

        <div style={{ width: 1, height: 36, background: "rgba(255,255,255,.1)", flexShrink: 0 }} />

        {/* Balance */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,.38)", letterSpacing: 1.5, marginBottom: 3 }}>{balanceLabel}</p>
          <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "clamp(14px, 3vw, 18px)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {balPrimary}
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{balSecondary}</p>
        </div>

        {/* Toggle + identity */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
          <BalanceToggle view={view} onChange={setView} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,.45)", letterSpacing: 1 }}>•••• {LAST4}</p>
            <Arcs sizes={[5, 8, 11]} />
          </div>
        </div>
      </div>
    );
  }

  // ── FULL card variant (ATM/debit card face — full-width, matches dashboard scale) ──
  return (
    <div style={{ ...sharedBg, width: "100%", borderRadius: 18, padding: "24px 28px", boxShadow: "0 14px 44px rgba(0,0,0,.55)", display: "flex", flexDirection: "column", gap: 18 }}>
      {[220, 320, 420].map(r => (
        <div key={r} style={{ position: "absolute", right: -r * .3, bottom: -r * .2, width: r, height: r, borderRadius: "50%", border: "1px solid rgba(255,255,255,.04)", pointerEvents: "none" }} />
      ))}
      <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,.22) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, left: -60, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(28,58,107,.28) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Row 1: brand + chip */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, letterSpacing: 1 }}>
            YeboBank
          </span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,.35)", letterSpacing: 2, border: "1px solid rgba(255,255,255,.12)", borderRadius: 4, padding: "2px 7px" }}>
            {(chipLabel ?? "SAVINGS ACCOUNT").toUpperCase()}
          </span>
        </div>
        <Chip />
      </div>

      {/* Row 2: balance */}
      <div style={{ position: "relative" }}>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,.4)", letterSpacing: 2.5, marginBottom: 6 }}>{balanceLabel}</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, flexWrap: "wrap" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "clamp(26px, 6vw, 36px)", letterSpacing: -.5, lineHeight: 1 }}>
            {balPrimary}
          </p>
          <BalanceToggle view={view} onChange={setView} />
        </div>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,255,255,.4)", marginTop: 5 }}>{balSecondary}</p>
      </div>

      {/* Row 3: card number + expiry + cardholder + arcs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid rgba(255,255,255,.07)", paddingTop: 16, position: "relative" }}>
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 14, letterSpacing: 3, color: "rgba(255,255,255,.85)" }}>
            •••• •••• •••• {LAST4}
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,.55)", marginTop: 7, letterSpacing: 1.5 }}>
            {name}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,.35)", letterSpacing: 1.5, marginBottom: 3 }}>VALID THRU</p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "rgba(255,255,255,.75)", marginBottom: 6 }}>{EXPIRY}</p>
          <Arcs />
        </div>
      </div>
    </div>
  );
}
