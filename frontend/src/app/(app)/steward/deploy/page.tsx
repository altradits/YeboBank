"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRate } from "@/lib/rate-context";
import { fmtKES, fmtKESraw, num, timeAgo } from "@/lib/format";
import { ATMCard } from "@/components/app/ATMCard";
import {
  getUser, getInvestorPositions, getIncomeSources, getPoolDeployments, deployPoolCapital,
  getVirtualCard,
} from "@/lib/api";
import type { PoolDeployment, VirtualCard } from "@/types";

type Tab = "mpesa" | "lightning" | "card";

const METHOD_ICON: Record<string, string> = {
  mpesa:     "ti-device-mobile",
  lightning: "ti-bolt",
  card:      "ti-credit-card",
};

export default function DeployCapitalPage() {
  const rate = useRate();

  const [poolSats,      setPoolSats]      = useState(0);
  const [deployedKes,   setDeployedKes]   = useState(0);
  const [phone,         setPhone]         = useState("");
  const [deployments,   setDeployments]   = useState<PoolDeployment[]>([]);
  const [virtualCard,   setVirtualCard]   = useState<VirtualCard | null>(null);
  const [loading,       setLoading]       = useState(true);

  // form
  const [tab,         setTab]         = useState<Tab>("mpesa");
  const [kesInput,    setKesInput]    = useState("");
  const [satsInput,   setSatsInput]   = useState("");
  const [destination, setDestination] = useState("");
  const [platform,    setPlatform]    = useState("");  // card tab: merchant/platform
  const [notes,       setNotes]       = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [deployed,    setDeployed]    = useState<PoolDeployment | null>(null);

  useEffect(() => {
    Promise.all([
      getUser(),
      getInvestorPositions(),
      getIncomeSources(),
      getPoolDeployments(),
      getVirtualCard(),
    ]).then(([user, positions, sources, deps, card]) => {
      setPhone(user.phone);
      setDestination(user.phone);
      setPoolSats(positions.reduce((s, p) => s + p.principalSats, 0));
      setDeployedKes(sources.reduce((s, src) => s + src.principalKes, 0));
      setDeployments(deps);
      setVirtualCard(card);
      setLoading(false);
    });
  }, []);

  function loadDeployments() {
    getPoolDeployments().then(setDeployments);
  }

  const deployedSats    = Math.round(deployedKes * rate.satsPerKes);
  const availableSats   = Math.max(0, poolSats - deployedSats);
  const availableKes    = availableSats * rate.kesPerSat;

  const kesNum          = parseFloat(kesInput.replace(/[^0-9.]/g, "")) || 0;
  const satsCostMpesa   = Math.round(kesNum * rate.satsPerKes);
  const cardKesNum      = parseFloat(kesInput.replace(/[^0-9.]/g, "")) || 0;
  const satsCostCard    = Math.round(cardKesNum * rate.satsPerKes);

  const exceedsAvailable =
    tab === "mpesa"     ? satsCostMpesa > availableSats :
    tab === "card"      ? satsCostCard  > availableSats :
    (parseInt(satsInput) || 0) > availableSats;

  function switchTab(t: Tab) {
    setTab(t);
    setKesInput(""); setSatsInput(""); setNotes(""); setPlatform("");
    setDestination(t === "mpesa" ? phone : "");
  }

  async function onDeploy() {
    setSubmitting(true);
    try {
      let dep: PoolDeployment;
      if (tab === "mpesa") {
        dep = await deployPoolCapital("mpesa", satsCostMpesa, kesNum, destination, notes || undefined);
      } else if (tab === "card") {
        const dest = platform.trim() || (virtualCard ? `Card •••• ${virtualCard.number.slice(-4)}` : "Virtual card");
        dep = await deployPoolCapital("card", satsCostCard, cardKesNum, dest, notes || undefined);
      } else {
        const sats = parseInt(satsInput) || 0;
        const kes  = Math.round(sats * rate.kesPerSat);
        dep = await deployPoolCapital("lightning", sats, kes, destination, notes || undefined);
      }
      setDeployed(dep);
      loadDeployments();
      setKesInput(""); setSatsInput(""); setNotes(""); setPlatform("");
      setDestination(phone);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setDeployed(null);
    setDestination(phone);
  }

  const canSubmit =
    tab === "mpesa"     ? kesNum > 0 && destination.trim().length > 0 && !exceedsAvailable :
    tab === "card"      ? cardKesNum > 0 && !exceedsAvailable :
    (parseInt(satsInput) || 0) > 0 && destination.trim().length > 0 && !exceedsAvailable;

  if (loading) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        <p className="note">Loading…</p>
      </div>
    );
  }

  return (
    <>
      <ATMCard
        variant="dashboard"
        chipLabel="DEPLOY CAPITAL"
        balanceLabel="AVAILABLE TO DEPLOY"
        balancePrimary={fmtKESraw(availableKes, 0)}
        balanceSecondary={`≈ ${num(availableSats)} sats${availableSats <= 0 ? " · Fully deployed" : ""}`}
        stats={[
          { label: "Pool received", value: `${num(poolSats)} sats`, sub: `≈ ${fmtKES(poolSats, rate, 0)}` },
          { label: "Already deployed", value: fmtKESraw(deployedKes, 0), sub: `${deployments.length} deployment${deployments.length !== 1 ? "s" : ""}` },
          { label: "Available", value: fmtKESraw(availableKes, 0), color: availableSats > 0 ? "#8ecb72" : undefined, sub: availableSats <= 0 ? "Fully deployed" : "Ready to deploy" },
        ]}
        actions={[
          { icon: "ti-arrow-left", label: "Console", path: "/steward" },
          { icon: "ti-users", label: "Investors", path: "/steward/investors" },
          { icon: "ti-user-check", label: "Access", path: "/steward/access" },
          { icon: "ti-arrow-bar-down", label: "Withdrawals", path: "/steward/withdrawals" },
        ]}
      />

      {/* Deploy form */}
      <div style={{ marginTop: 20 }}>
        {deployed ? (
          /* ── Success ── */
          <div className="card" style={{ textAlign: "center", padding: "28px 20px" }}>
            <i className="ti ti-circle-check" style={{ fontSize: 44, color: "var(--emerald-deep)" }} />
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginTop: 12 }}>
              {deployed.method === "mpesa"
                ? `KES ${num(deployed.amountKes, 0)} sent via M-Pesa`
                : deployed.method === "card"
                ? `KES ${num(deployed.amountKes, 0)} recorded via card`
                : `${num(deployed.amountSats)} sats sent via Lightning`}
            </h2>
            <p className="note" style={{ marginTop: 8 }}>
              To: {deployed.destination}
              {deployed.notes && <> · {deployed.notes}</>}
            </p>
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
              <Link
                href={`/steward/income?prefilledKes=${deployed.amountKes}`}
                className="btn btn-primary"
                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <i className="ti ti-plus" /> Record as income source
              </Link>
              <button className="btn btn-ghost" onClick={reset}>Deploy more</button>
            </div>
          </div>
        ) : (
          /* ── Form ── */
          <div className="card">
            <div className="seg" style={{ marginBottom: 20 }}>
              <button className={tab === "mpesa"     ? "on" : ""} onClick={() => switchTab("mpesa")}>
                <i className="ti ti-device-mobile" /> M-Pesa
              </button>
              <button className={tab === "lightning" ? "on" : ""} onClick={() => switchTab("lightning")}>
                <i className="ti ti-bolt" /> Lightning
              </button>
              <button className={tab === "card"      ? "on" : ""} onClick={() => switchTab("card")}>
                <i className="ti ti-credit-card" /> Card
              </button>
            </div>

            {/* ── M-Pesa tab ── */}
            {tab === "mpesa" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <label className="field-group">
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>Amount (KES)</span>
                  <input
                    className="amount-input" inputMode="decimal" placeholder="0"
                    value={kesInput} onChange={(e) => setKesInput(e.target.value)}
                  />
                </label>
                {kesNum > 0 && (
                  <p className="note" style={{ textAlign: "center" }}>
                    Deploys ≈ <b>{num(satsCostMpesa)} sats</b> from pool
                    {exceedsAvailable && <span style={{ color: "var(--terracotta)", marginLeft: 6 }}>— exceeds available</span>}
                  </p>
                )}
                <label className="field-group">
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>Recipient phone</span>
                  <input
                    className="input" type="tel" placeholder="+2547XXXXXXXX"
                    value={destination} onChange={(e) => setDestination(e.target.value)}
                  />
                </label>
                <label className="field-group">
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>Notes (optional)</span>
                  <input className="input" placeholder="e.g. Kilimani property deposit"
                    value={notes} onChange={(e) => setNotes(e.target.value)} />
                </label>
                <button className="btn btn-primary" disabled={!canSubmit || submitting} onClick={onDeploy}>
                  {submitting ? "Sending…" : <><i className="ti ti-arrow-bar-up" /> Deploy via M-Pesa</>}
                </button>
              </div>
            )}

            {/* ── Lightning tab ── */}
            {tab === "lightning" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <label className="field-group">
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>Lightning invoice or address</span>
                  <input
                    className="input" placeholder="lnbc… or user@domain.com"
                    value={destination} onChange={(e) => setDestination(e.target.value)}
                  />
                </label>
                <label className="field-group">
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>Amount (sats)</span>
                  <input
                    className="amount-input" inputMode="numeric" placeholder="0"
                    value={satsInput} onChange={(e) => setSatsInput(e.target.value)}
                  />
                </label>
                {(parseInt(satsInput) || 0) > 0 && (
                  <p className="note" style={{ textAlign: "center" }}>
                    ≈ <b>{fmtKESraw(Math.round((parseInt(satsInput) || 0) * rate.kesPerSat), 0)}</b>
                    {exceedsAvailable && <span style={{ color: "var(--terracotta)", marginLeft: 6 }}>— exceeds available</span>}
                  </p>
                )}
                <label className="field-group">
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>Notes (optional)</span>
                  <input className="input" placeholder="e.g. T-bill top-up"
                    value={notes} onChange={(e) => setNotes(e.target.value)} />
                </label>
                <button className="btn btn-primary" disabled={!canSubmit || submitting} onClick={onDeploy}>
                  {submitting ? "Sending…" : <><i className="ti ti-bolt" /> Deploy via Lightning</>}
                </button>
              </div>
            )}

            {/* ── Card tab ── */}
            {tab === "card" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {!virtualCard ? (
                  /* No card generated yet */
                  <div style={{ textAlign: "center", padding: "28px 0" }}>
                    <i className="ti ti-credit-card" style={{ fontSize: 36, color: "var(--gold)", display: "block", marginBottom: 12 }} />
                    <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
                      No payment card yet
                    </p>
                    <p className="note" style={{ marginBottom: 16, maxWidth: 320, marginInline: "auto" }}>
                      Generate a virtual card with a rotating CVV to deploy capital to platforms that require card details.
                    </p>
                    <Link href="/steward/card" className="btn btn-primary"
                      style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <i className="ti ti-plus" /> Generate payment card
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Card chip preview */}
                    <div style={{
                      background: "linear-gradient(135deg, #0f1f0f 0%, #1a2e1a 55%, #2c1f08 100%)",
                      borderRadius: 14, padding: "16px 20px", color: "white",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      position: "relative", overflow: "hidden",
                    }}>
                      {/* decorative rings */}
                      {[140, 200].map((r) => (
                        <div key={r} style={{
                          position: "absolute", right: -r / 2, top: -r / 3,
                          width: r, height: r, borderRadius: "50%",
                          border: "1px solid rgba(255,255,255,.06)", pointerEvents: "none",
                        }} />
                      ))}
                      <div style={{ position: "relative" }}>
                        <p style={{ fontSize: 9, color: "rgba(255,255,255,.45)", letterSpacing: 2, marginBottom: 6 }}>
                          VIRTUAL CARD · GLOBAL
                        </p>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: 16, letterSpacing: 3, color: "white" }}>
                          •••• •••• •••• {virtualCard.number.slice(-4)}
                        </p>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,255,255,.55)", marginTop: 6 }}>
                          {virtualCard.cardholder}
                        </p>
                      </div>
                      <Link href="/steward/card"
                        style={{ color: "rgba(255,255,255,.55)", fontSize: 12, textDecoration: "none",
                          display: "flex", alignItems: "center", gap: 5, position: "relative" }}>
                        Full details <i className="ti ti-arrow-right" style={{ fontSize: 13 }} />
                      </Link>
                    </div>

                    <label className="field-group">
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>Amount (KES)</span>
                      <input
                        className="amount-input" inputMode="decimal" placeholder="0"
                        value={kesInput} onChange={(e) => setKesInput(e.target.value)}
                      />
                    </label>
                    {cardKesNum > 0 && (
                      <p className="note" style={{ textAlign: "center" }}>
                        Deploys ≈ <b>{num(satsCostCard)} sats</b> from pool
                        {exceedsAvailable && <span style={{ color: "var(--terracotta)", marginLeft: 6 }}>— exceeds available</span>}
                      </p>
                    )}
                    <label className="field-group">
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>Platform / Merchant</span>
                      <input
                        className="input" placeholder="e.g. NSE broker, property platform"
                        value={platform} onChange={(e) => setPlatform(e.target.value)}
                      />
                    </label>
                    <label className="field-group">
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>Notes (optional)</span>
                      <input className="input" placeholder="e.g. Kilimani apartment deposit"
                        value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </label>
                    <button className="btn btn-primary" disabled={!canSubmit || submitting} onClick={onDeploy}>
                      {submitting ? "Recording…" : <><i className="ti ti-credit-card" /> Record card deployment</>}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Past deployments */}
      {deployments.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, marginBottom: 12 }}>
            Deployment history
          </h2>
          {deployments.map((d, i) => (
            <div key={d.id} style={{
              padding: "12px 0",
              borderBottom: i < deployments.length - 1 ? "1px solid var(--border-soft)" : "none",
              display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12,
            }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                  background: "var(--surface-raised)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <i className={`ti ${METHOD_ICON[d.method] ?? "ti-arrow-bar-up"}`}
                    style={{ fontSize: 16, color: "var(--gold)" }} />
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14 }}>
                    {d.method === "mpesa" ? "M-Pesa" : d.method === "card" ? "Card" : "Lightning"}
                  </div>
                  <div className="note" style={{ marginTop: 2 }}>{d.destination}</div>
                  {d.notes && <div className="note" style={{ marginTop: 2, color: "var(--muted)" }}>{d.notes}</div>}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: "var(--emerald-deep)" }}>
                  {fmtKESraw(d.amountKes, 0)}
                </div>
                <div className="note" style={{ marginTop: 2 }}>{timeAgo(d.deployedAt)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
