"use client";

import { useRouter } from "next/navigation";
import { num, fmtKESraw } from "@/lib/format";
import { useRate } from "@/lib/rate-context";

const BG = "linear-gradient(135deg, #050A06 0%, #0A2016 50%, #1C1200 100%)";

interface Props {
  name: string;
  totalAumKes: number;
  totalFeeKes: number;
  incomeCount: number;
  investorCount: number;
  pendingAccess: number;
  pendingWithdrawals: number;
}

export function MlinziCard({
  name,
  totalAumKes,
  totalFeeKes,
  incomeCount,
  investorCount,
  pendingAccess,
  pendingWithdrawals,
}: Props) {
  const rate   = useRate();
  const router = useRouter();

  const aumSats = Math.round(totalAumKes * (rate.satsPerKes ?? 0));

  const stats = [
    {
      label: "Income sources",
      value: `${incomeCount} stream${incomeCount !== 1 ? "s" : ""}`,
      sub:   "Capital at work",
    },
    {
      label: "Investors",
      value: `${investorCount} position${investorCount !== 1 ? "s" : ""}`,
      sub:   "Friends & family",
    },
    {
      label: "Fee earned (2% of profit)",
      value: fmtKESraw(totalFeeKes, 0),
      sub:   "This cycle",
      color: "#8ecb72" as const,
    },
  ];

  const pendingTotal = pendingAccess + pendingWithdrawals;

  const actions: { icon: string; label: string; path: string; badge?: number }[] = [
    { icon: "ti-send",           label: "Deploy",      path: "/mlinzi/deploy" },
    { icon: "ti-users",         label: "Investors",   path: "/mlinzi/investors" },
    { icon: "ti-user-check",    label: "Access",      path: "/mlinzi/access",      badge: pendingAccess },
    { icon: "ti-receipt",       label: "Withdrawals", path: "/mlinzi/withdrawals", badge: pendingWithdrawals },
  ];

  return (
    <div style={{
      background: BG, color: "white",
      borderRadius: 18, padding: "24px 28px",
      boxShadow: "0 14px 44px rgba(0,0,0,.5)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Glow orbs */}
      <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,.2) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, left: -60, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(46,100,46,.3) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Top row: brand + name */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, letterSpacing: 1 }}>
            Ye<span style={{ color: "#C9A84C" }}>B</span>o
          </span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,.35)", letterSpacing: 2.5, border: "1px solid rgba(255,255,255,.12)", borderRadius: 4, padding: "2px 7px" }}>
            MLINZI CONSOLE
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {pendingTotal > 0 && (
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
              background: "#C9A84C", color: "#3a2c00",
              borderRadius: 999, padding: "2px 8px", letterSpacing: .5,
            }}>
              {pendingTotal} PENDING
            </span>
          )}
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,.45)", letterSpacing: 1 }}>
            {name.toUpperCase()}
          </p>
        </div>
      </div>

      {/* AUM balance */}
      <div style={{ marginTop: 22, position: "relative" }}>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,.38)", letterSpacing: 2.5, marginBottom: 6 }}>
          ASSETS UNDER MANAGEMENT
        </p>
        <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "clamp(26px, 6vw, 36px)", letterSpacing: -.5, lineHeight: 1 }}>
          {fmtKESraw(totalAumKes, 0)}
        </p>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,255,255,.4)", marginTop: 5 }}>
          ≈ {num(aumSats)} sats
        </p>
      </div>

      {/* Stats strip */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        marginTop: 22,
        borderTop: "1px solid rgba(255,255,255,.09)",
        borderBottom: "1px solid rgba(255,255,255,.09)",
        paddingBlock: 14,
      }}>
        {stats.map((s, i, arr) => (
          <div key={s.label} style={{
            padding: "0 16px",
            borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,.08)" : "none",
          }}>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,.38)", letterSpacing: 1.5, marginBottom: 5 }}>
              {s.label.toUpperCase()}
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: s.color ?? "white" }}>
              {s.value}
            </p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,.35)", marginTop: 3 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 16 }}>
        {actions.map(({ icon, label, path, badge }) => (
          <button key={path} onClick={() => router.push(path)} style={{
            background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)",
            color: "#fff", borderRadius: 12, padding: "12px 6px",
            fontSize: 12, fontWeight: 500, cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
            transition: "background .2s, transform .2s",
            position: "relative",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.15)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.07)"; (e.currentTarget as HTMLElement).style.transform = ""; }}
          >
            <div style={{ position: "relative" }}>
              <i className={`ti ${icon}`} style={{ color: "#8ecb72", fontSize: 20 }} />
              {!!badge && (
                <span style={{
                  position: "absolute", top: -4, right: -8,
                  background: "#C9A84C", color: "#3a2c00",
                  fontSize: 9, fontWeight: 700, fontFamily: "var(--font-mono)",
                  borderRadius: 999, minWidth: 15, height: 15,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "0 3px",
                }}>
                  {badge}
                </span>
              )}
            </div>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
