"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import {
  getVirtualCard, generateVirtualCard, rotateCvvNow, updateVirtualCard, deleteVirtualCard,
} from "@/lib/api";
import type { VirtualCard } from "@/types";
import { ATMCard } from "@/components/app/ATMCard";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const ROTATION_OPTIONS = [
  { label: "5 minutes",  secs: 300 },
  { label: "15 minutes", secs: 900 },
  { label: "30 minutes", secs: 1_800 },
  { label: "1 hour",     secs: 3_600 },
  { label: "24 hours",   secs: 86_400 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function fmtCardNumber(n: string, masked: boolean): string {
  if (masked) return `•••• •••• •••• ${n.slice(-4)}`;
  return [n.slice(0, 4), n.slice(4, 8), n.slice(8, 12), n.slice(12)].join(" ");
}

function fmtExpiry(month: number, year: number): string {
  return `${String(month).padStart(2, "0")}/${String(year).slice(-2)}`;
}

function fmtCountdown(secs: number): string {
  if (secs <= 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value);
    setDone(true);
    setTimeout(() => setDone(false), 1800);
  }
  return (
    <button onClick={copy} title={`Copy ${label ?? ""}`} style={{
      background: "none", border: "none", cursor: "pointer",
      color: done ? "var(--emerald-deep)" : "var(--soft)",
      fontSize: 14, padding: "0 4px",
    }}>
      <i className={`ti ${done ? "ti-check" : "ti-copy"}`} />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Visual card component
// ─────────────────────────────────────────────────────────────────────────────
function CardFace({ card, revealNumber, revealCvv, secsLeft, onRevealNumber, onRevealCvv }: {
  card: VirtualCard;
  revealNumber: boolean;
  revealCvv: boolean;
  secsLeft: number;
  onRevealNumber: () => void;
  onRevealCvv: () => void;
}) {
  const pct = Math.min(100, Math.max(0, (secsLeft / card.cvvRotationPeriodSecs) * 100));

  return (
    <div style={{
      width: "100%", maxWidth: 380,
      background: "linear-gradient(135deg, #0f1f0f 0%, #1a2e1a 55%, #2c1f08 100%)",
      borderRadius: 18, padding: "24px 28px", color: "white",
      position: "relative", overflow: "hidden",
      boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
      userSelect: "none",
    }}>
      {/* Background texture rings */}
      {[180, 260, 340].map((r) => (
        <div key={r} style={{
          position: "absolute", right: -r / 2, top: -r / 3,
          width: r, height: r, borderRadius: "50%",
          border: "1px solid rgba(255,255,255,.05)",
          pointerEvents: "none",
        }} />
      ))}

      {/* Top row: brand + type */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
        <div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, letterSpacing: 1 }}>
            Ye<span style={{ color: "#C9A84C" }}>B</span>
          </span>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,.45)", letterSpacing: 2, marginTop: 2 }}>VIRTUAL · GLOBAL</p>
        </div>
        {/* Chip */}
        <div style={{
          width: 36, height: 28, borderRadius: 5,
          background: "linear-gradient(135deg, #C9A84C 0%, #E8C96D 50%, #A07830 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ width: 22, height: 18, borderRadius: 3, border: "1px solid rgba(0,0,0,.25)" }}>
            <div style={{ borderTop: "1px solid rgba(0,0,0,.2)", margin: "5px 3px 0" }} />
            <div style={{ borderTop: "1px solid rgba(0,0,0,.2)", margin: "3px 3px 0" }} />
          </div>
        </div>
      </div>

      {/* Card number */}
      <div style={{ marginBottom: 18 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 19, letterSpacing: 3, color: "white" }}>
          {fmtCardNumber(card.number, !revealNumber)}
        </p>
        <button onClick={onRevealNumber} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "rgba(255,255,255,.45)", fontSize: 11, marginTop: 4, padding: 0,
        }}>
          <i className={`ti ${revealNumber ? "ti-eye-off" : "ti-eye"}`} style={{ marginRight: 4 }} />
          {revealNumber ? "Hide" : "Reveal full number"}
        </button>
      </div>

      {/* Bottom row: name + expiry + CVV */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,.4)", letterSpacing: 2, marginBottom: 4 }}>CARDHOLDER</p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, letterSpacing: 2 }}>{card.cardholder}</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,.4)", letterSpacing: 2, marginBottom: 4 }}>EXPIRES</p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{fmtExpiry(card.expiryMonth, card.expiryYear)}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,.4)", letterSpacing: 2, marginBottom: 4 }}>CVV</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 14 }}>
              {revealCvv ? card.cvv : "•••"}
            </p>
            <button onClick={onRevealCvv} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,.45)", fontSize: 12, padding: 0,
            }}>
              <i className={`ti ${revealCvv ? "ti-eye-off" : "ti-eye"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* CVV rotation bar */}
      <div style={{ marginTop: 18 }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 6,
        }}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,.4)", letterSpacing: 1 }}>CVV REFRESHES IN</p>
          <p style={{
            fontFamily: "var(--font-mono)", fontSize: 12,
            color: pct < 25 ? "#ff6b6b" : "rgba(255,255,255,.7)",
          }}>{fmtCountdown(secsLeft)}</p>
        </div>
        <div style={{ height: 3, background: "rgba(255,255,255,.1)", borderRadius: 2 }}>
          <div style={{
            height: "100%", borderRadius: 2,
            width: `${pct}%`,
            background: pct < 25
              ? "linear-gradient(90deg, #ff6b6b, #ff8e8e)"
              : "linear-gradient(90deg, #C9A84C, #E8C96D)",
            transition: "width 1s linear",
          }} />
        </div>
      </div>

      {/* Frozen overlay */}
      {card.status === "frozen" && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 18,
          background: "rgba(0,0,0,.7)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 8,
        }}>
          <i className="ti ti-snowflake" style={{ fontSize: 32, color: "#7ecfff" }} />
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "white", letterSpacing: 2 }}>
            CARD FROZEN
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function CardPage() {
  const rate = useRate();
  const [card,          setCard]          = useState<VirtualCard | null | "loading">("loading");
  const [revealNumber,  setRevealNumber]  = useState(false);
  const [revealCvv,     setRevealCvv]     = useState(false);
  const [secsLeft,      setSecsLeft]      = useState(0);
  const [rotating,      setRotating]      = useState(false);
  const [busy,          setBusy]          = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showGenerate,  setShowGenerate]  = useState(false);

  // Generate form
  const [genPeriod,  setGenPeriod]  = useState(900);
  const [genLimit,   setGenLimit]   = useState("");
  const [genUseSats, setGenUseSats] = useState(false);

  async function load() {
    const c = await getVirtualCard();
    setCard(c);
  }
  useEffect(() => { load(); }, []);

  // Live countdown — updates every second, auto-rotates CVV when it hits 0
  useEffect(() => {
    if (!card || card === "loading") return;
    function tick() {
      if (!card || card === "loading") return;
      const secs = Math.max(0, Math.ceil((new Date(card.cvvRotatesAt).getTime() - Date.now()) / 1000));
      setSecsLeft(secs);
      if (secs === 0 && !rotating) {
        setRotating(true);
        rotateCvvNow().then(updated => {
          setCard(updated);
          setRevealCvv(false);
          setRotating(false);
        });
      }
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [card, rotating]);

  // Auto-hide revealed number/CVV after 30 seconds
  const revealNumTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealCvvTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleRevealNumber() {
    setRevealNumber(v => {
      if (!v) {
        if (revealNumTimer.current) clearTimeout(revealNumTimer.current);
        revealNumTimer.current = setTimeout(() => setRevealNumber(false), 30_000);
      }
      return !v;
    });
  }
  function handleRevealCvv() {
    setRevealCvv(v => {
      if (!v) {
        if (revealCvvTimer.current) clearTimeout(revealCvvTimer.current);
        revealCvvTimer.current = setTimeout(() => setRevealCvv(false), 30_000);
      }
      return !v;
    });
  }

  async function handleGenerate() {
    setBusy(true);
    const limitSats = genLimit
      ? genUseSats
        ? Math.round(Number(genLimit))
        : Math.round(Number(genLimit) / rate.kesPerSat)
      : null;
    const c = await generateVirtualCard(genPeriod, limitSats);
    setCard(c); setRevealNumber(false); setRevealCvv(false);
    setShowGenerate(false); setBusy(false);
  }

  async function handleRotateNow() {
    if (!card || card === "loading") return;
    setBusy(true);
    const updated = await rotateCvvNow();
    setCard(updated); setRevealCvv(false); setBusy(false);
  }

  async function handleFreeze() {
    if (!card || card === "loading") return;
    setBusy(true);
    const updated = await updateVirtualCard({ status: card.status === "active" ? "frozen" : "active" });
    setCard(updated); setBusy(false);
  }

  async function handleDelete() {
    setBusy(true);
    await deleteVirtualCard();
    setCard(null); setConfirmDelete(false); setBusy(false);
  }

  // ── Render ──
  const c = card === "loading" ? null : card;

  return (
    <>
      <ATMCard
        variant="dashboard"
        chipLabel="VIRTUAL CARD"
        balanceLabel="DEPLOYMENT CARD"
        balancePrimary={c ? `•••• •••• •••• ${c.number.slice(-4)}` : "No card"}
        balanceSecondary={c ? `${c.status === "frozen" ? "Frozen" : "Active"} · CVV rotates every ${ROTATION_OPTIONS.find(o => o.secs === c.cvvRotationPeriodSecs)?.label ?? "…"}` : "Generate a card to deploy capital via platforms"}
        stats={[
          { label: "Total deployed", value: c ? `${num(c.totalDeployedSats)} sats` : "—", sub: c ? `≈ KES ${num(Math.round(c.totalDeployedSats * rate.kesPerSat))}` : "Via card" },
          { label: "Limit", value: c?.limitSats ? `${num(c.limitSats)} sats` : "No limit", sub: "Per transaction" },
          { label: "Status", value: c ? (c.status === "frozen" ? "Frozen" : "Active") : "—", color: c?.status === "frozen" ? "#7ecfff" : c ? "#8ecb72" : undefined, sub: "Card state" },
        ]}
        actions={[
          { icon: "ti-layout-dashboard", label: "Console",     path: "/mlinzi" },
          { icon: "ti-users",            label: "Investors",   path: "/mlinzi/investors" },
          { icon: "ti-user-check",       label: "Access",      path: "/mlinzi/access" },
          { icon: "ti-send",             label: "Deploy",      path: "/mlinzi/deploy" },
        ]}
      />

      <div className="section-head" style={{ marginTop: 18 }}>
        <div>
          <h1 className="page-title">Global Payment Card</h1>
          <p className="page-sub">Virtual deployment card</p>
        </div>
      </div>

      <div className="notif-banner">
        <i className="ti ti-rotate-clockwise" />
        <span>
          The CVV rotates automatically on a timer.
          Auto-renewals and subscriptions can never charge after your transaction completes.
        </span>
      </div>

      {/* ── No card yet ── */}
      {card === "loading" && <p className="note" style={{ marginTop: 20 }}>Loading…</p>}

      {card === null && !showGenerate && (
        <div className="card" style={{ marginTop: 14, textAlign: "center", padding: "40px 24px" }}>
          <i className="ti ti-credit-card" style={{ fontSize: 40, color: "var(--gold)", display: "block", marginBottom: 14 }} />
          <h2 style={{ fontFamily: "var(--font-display)", marginBottom: 8 }}>No card generated yet</h2>
          <p className="note" style={{ maxWidth: 400, marginInline: "auto", marginBottom: 20 }}>
            Generate a virtual card to deploy capital to investment platforms that only accept bank cards.
            The CVV rotates so no platform can auto-charge after your transaction.
          </p>
          <button className="btn btn-primary" onClick={() => setShowGenerate(true)}>
            <i className="ti ti-plus" /> Generate card
          </button>
        </div>
      )}

      {/* ── Generate form ── */}
      {showGenerate && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="section-head" style={{ marginBottom: 16 }}>
            <h2>Card settings</h2>
            {!busy && (
              <button onClick={() => setShowGenerate(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--soft)", fontSize: 13 }}>
                Cancel
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                CVV rotation period
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ROTATION_OPTIONS.map(o => (
                  <button key={o.secs} onClick={() => setGenPeriod(o.secs)} style={{
                    padding: "7px 14px", borderRadius: "var(--r-sm)", cursor: "pointer",
                    background: genPeriod === o.secs ? "var(--forest)" : "var(--ivory)",
                    color: genPeriod === o.secs ? "white" : "var(--text)",
                    border: `1.5px solid ${genPeriod === o.secs ? "var(--forest)" : "var(--border)"}`,
                    fontSize: 13, fontWeight: genPeriod === o.secs ? 600 : 400,
                  }}>{o.label}</button>
                ))}
              </div>
              <p className="note" style={{ marginTop: 6 }}>
                The CVV shown on this screen changes every {ROTATION_OPTIONS.find(o => o.secs === genPeriod)?.label ?? "—"}.
                Any subscription service that stored the old CVV will be silently rejected.
              </p>
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                Per-transaction spending limit <span style={{ fontWeight: 400, color: "var(--soft)" }}>(optional)</span>
              </label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input className="input" type="number" min="0"
                  placeholder={genUseSats ? "Limit in sats" : "Limit in KES"}
                  value={genLimit}
                  onChange={e => setGenLimit(e.target.value)}
                  style={{ maxWidth: 200 }} />
                <div style={{ display: "flex", borderRadius: "var(--r-sm)", border: "1px solid var(--border)", overflow: "hidden" }}>
                  {[{ id: false, label: "KES" }, { id: true, label: "Sats" }].map(({ id, label }) => (
                    <button key={String(id)} onClick={() => setGenUseSats(id)} style={{
                      padding: "8px 14px", border: "none", cursor: "pointer", fontSize: 13,
                      background: genUseSats === id ? "var(--forest)" : "transparent",
                      color: genUseSats === id ? "white" : "var(--text)",
                      fontWeight: genUseSats === id ? 600 : 400,
                      borderRight: !id ? "1px solid var(--border)" : "none",
                    }}>{label}</button>
                  ))}
                </div>
              </div>
              {genLimit && Number(genLimit) > 0 && (
                <p className="note" style={{ marginTop: 5 }}>
                  ≈ {genUseSats
                    ? `KES ${num(Math.round(Number(genLimit) * rate.kesPerSat))}`
                    : `${num(Math.round(Number(genLimit) / rate.kesPerSat))} sats`}
                </p>
              )}
              <p className="note" style={{ marginTop: 4 }}>Leave empty for no hard limit.</p>
            </div>

            <div style={{ borderTop: "1px solid var(--border-soft)", paddingTop: 14, display: "flex", gap: 10 }}>
              <button className="btn btn-primary" disabled={busy} onClick={handleGenerate}>
                {busy ? "Generating…" : c ? "Replace card" : "Generate card"}
              </button>
              <button className="btn btn-ghost" disabled={busy} onClick={() => setShowGenerate(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Active card ── */}
      {c && !showGenerate && (
        <>
          {/* Card visual */}
          <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
            <CardFace
              card={c}
              revealNumber={revealNumber}
              revealCvv={revealCvv}
              secsLeft={secsLeft}
              onRevealNumber={handleRevealNumber}
              onRevealCvv={handleRevealCvv}
            />
          </div>

          {/* Copyable details */}
          <div className="card" style={{ marginTop: 14 }}>
            <h2 style={{ marginBottom: 14 }}>Card details</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                {
                  label: "Card number",
                  display: fmtCardNumber(c.number, !revealNumber),
                  copyValue: c.number,
                  reveal: !revealNumber,
                  onReveal: handleRevealNumber,
                },
                {
                  label: "Cardholder name",
                  display: c.cardholder,
                  copyValue: c.cardholder,
                },
                {
                  label: "Expiry date",
                  display: fmtExpiry(c.expiryMonth, c.expiryYear),
                  copyValue: fmtExpiry(c.expiryMonth, c.expiryYear),
                },
                {
                  label: "CVV / Security code",
                  display: revealCvv ? c.cvv : "•••",
                  copyValue: c.cvv,
                  reveal: !revealCvv,
                  onReveal: handleRevealCvv,
                  sub: `Rotates in ${fmtCountdown(secsLeft)}`,
                },
                {
                  label: "Billing address",
                  display: c.billingLine1,
                  copyValue: c.billingLine1,
                },
                {
                  label: "City / Postal code",
                  display: `${c.billingCity}, ${c.billingPostalCode}`,
                  copyValue: `${c.billingCity} ${c.billingPostalCode}`,
                },
                {
                  label: "Country",
                  display: "Kenya (KE)",
                  copyValue: "KE",
                },
              ].map((row, i, arr) => (
                <div key={row.label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "11px 0",
                  borderBottom: i < arr.length - 1 ? "1px solid var(--border-soft)" : "none",
                }}>
                  <div>
                    <p className="note" style={{ fontSize: 11, marginBottom: 2 }}>{row.label}</p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 14 }}>{row.display}</p>
                    {row.sub && <p className="note" style={{ fontSize: 11, marginTop: 2, color: secsLeft < 60 ? "var(--terra-text)" : undefined }}>{row.sub}</p>}
                  </div>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {row.reveal !== undefined && (
                      <button onClick={row.onReveal} style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--soft)", fontSize: 14, padding: "0 4px",
                      }}>
                        <i className={`ti ${row.reveal ? "ti-eye" : "ti-eye-off"}`} />
                      </button>
                    )}
                    <CopyButton value={row.copyValue} label={row.label} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Spending */}
          <div className="card" style={{ marginTop: 10 }}>
            <h2 style={{ marginBottom: 12 }}>Spending</h2>
            <div className="grid-2">
              <div>
                <p className="note">Total deployed via card</p>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginTop: 4 }}>
                  {num(c.totalDeployedSats)} sats
                </p>
                <p className="note" style={{ marginTop: 2 }}>≈ KES {num(Math.round(c.totalDeployedSats * rate.kesPerSat))}</p>
              </div>
              <div>
                <p className="note">Per-transaction limit</p>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginTop: 4 }}>
                  {c.limitSats ? `${num(c.limitSats)} sats` : "No limit set"}
                </p>
                {c.limitSats && (
                  <p className="note" style={{ marginTop: 2 }}>≈ KES {num(Math.round(c.limitSats * rate.kesPerSat))}</p>
                )}
              </div>
            </div>
            {c.lastUsedAt && (
              <p className="note" style={{ marginTop: 10, borderTop: "1px solid var(--border-soft)", paddingTop: 10 }}>
                Last used: {new Date(c.lastUsedAt).toLocaleString()}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="card" style={{ marginTop: 10 }}>
            <h2 style={{ marginBottom: 14 }}>Card controls</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

              {/* Rotate CVV */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 14px", background: "var(--ivory)", border: "1px solid var(--border)",
                borderRadius: "var(--r-sm)",
              }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13 }}>
                    <i className="ti ti-rotate-clockwise" style={{ marginRight: 8, color: "var(--gold)" }} />
                    Rotate CVV now
                  </p>
                  <p className="note" style={{ marginTop: 3 }}>
                    Generates a new CVV immediately and resets the timer.
                    Do this after any sensitive transaction to invalidate the code.
                  </p>
                </div>
                <button className="btn btn-ghost" disabled={busy} onClick={handleRotateNow}
                  style={{ flexShrink: 0, marginLeft: 16 }}>
                  {busy ? "…" : "Rotate"}
                </button>
              </div>

              {/* Freeze */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 14px", background: "var(--ivory)",
                border: `1px solid ${c.status === "frozen" ? "rgba(126,207,255,.4)" : "var(--border)"}`,
                borderRadius: "var(--r-sm)",
              }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13 }}>
                    <i className={`ti ti-snowflake`} style={{ marginRight: 8, color: "#7ecfff" }} />
                    {c.status === "frozen" ? "Card is frozen — tap to unfreeze" : "Freeze card"}
                  </p>
                  <p className="note" style={{ marginTop: 3 }}>
                    A frozen card is instantly declined everywhere. Unfreeze when you're ready to deploy.
                  </p>
                </div>
                <button className="btn btn-ghost" disabled={busy} onClick={handleFreeze}
                  style={{ flexShrink: 0, marginLeft: 16 }}>
                  {c.status === "frozen" ? "Unfreeze" : "Freeze"}
                </button>
              </div>

              {/* Change settings */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 14px", background: "var(--ivory)", border: "1px solid var(--border)",
                borderRadius: "var(--r-sm)",
              }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13 }}>
                    <i className="ti ti-settings" style={{ marginRight: 8, color: "var(--soft)" }} />
                    Change rotation period or limit
                  </p>
                  <p className="note" style={{ marginTop: 3 }}>Replaces the current card with a new one (same number format, new CVV).</p>
                </div>
                <button className="btn btn-ghost" onClick={() => setShowGenerate(true)}
                  style={{ flexShrink: 0, marginLeft: 16 }}>
                  Edit
                </button>
              </div>

              {/* Delete */}
              {!confirmDelete
                ? (
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 14px", background: "rgba(185,72,50,.04)",
                    border: "1px solid rgba(185,72,50,.2)", borderRadius: "var(--r-sm)",
                  }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 13, color: "var(--terra-text)" }}>
                        <i className="ti ti-trash" style={{ marginRight: 8 }} />Delete card
                      </p>
                      <p className="note" style={{ marginTop: 3 }}>Permanently destroys the card number, CVV, and billing details.</p>
                    </div>
                    <button onClick={() => setConfirmDelete(true)}
                      style={{
                        border: "none", background: "none", cursor: "pointer",
                        color: "var(--terra-text)", fontWeight: 600, fontSize: 13,
                        flexShrink: 0, marginLeft: 16,
                      }}>
                      Delete
                    </button>
                  </div>
                )
                : (
                  <div style={{
                    padding: "14px", background: "rgba(185,72,50,.06)",
                    border: "1.5px solid rgba(185,72,50,.35)", borderRadius: "var(--r-sm)",
                  }}>
                    <p style={{ fontWeight: 600, fontSize: 13, color: "var(--terra-text)", marginBottom: 10 }}>
                      <i className="ti ti-alert-triangle" style={{ marginRight: 8 }} />
                      Are you sure? The card number and CVV will be gone permanently.
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn-primary" style={{ background: "var(--terra-text)", borderColor: "var(--terra-text)" }}
                        disabled={busy} onClick={handleDelete}>
                        {busy ? "Deleting…" : "Yes, delete"}
                      </button>
                      <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>Keep card</button>
                    </div>
                  </div>
                )}
            </div>
          </div>

          <p className="note" style={{ marginTop: 14, textAlign: "center", fontSize: 11 }}>
            Card details auto-hide 30 seconds after reveal.
            This card is for single-use investment deployments — not for recurring services.
          </p>
        </>
      )}
    </>
  );
}
