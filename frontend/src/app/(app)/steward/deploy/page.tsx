"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRate } from "@/lib/rate-context";
import { fmtKES, fmtKESraw, num, timeAgo } from "@/lib/format";
import { getUser, getInvestorPositions, getIncomeSources, getPoolDeployments, deployPoolCapital } from "@/lib/api";
import type { PoolDeployment } from "@/types";

const METHOD_ICON: Record<string, string> = {
  mpesa: "ti-device-mobile",
  lightning: "ti-bolt",
};

export default function DeployCapitalPage() {
  const rate = useRate();

  const [poolSats, setPoolSats]         = useState(0);
  const [deployedKes, setDeployedKes]   = useState(0);
  const [phone, setPhone]               = useState("");
  const [deployments, setDeployments]   = useState<PoolDeployment[]>([]);
  const [loading, setLoading]           = useState(true);

  // Form state
  const [tab, setTab]                 = useState<"mpesa" | "lightning">("mpesa");
  const [kesInput, setKesInput]       = useState("");
  const [satsInput, setSatsInput]     = useState("");
  const [destination, setDestination] = useState("");
  const [notes, setNotes]             = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [deployed, setDeployed]       = useState<PoolDeployment | null>(null);

  useEffect(() => {
    Promise.all([
      getUser(),
      getInvestorPositions(),
      getIncomeSources(),
      getPoolDeployments(),
    ]).then(([user, positions, sources, deps]) => {
      setPhone(user.phone);
      setDestination(user.phone);
      setPoolSats(positions.reduce((s, p) => s + p.principalSats, 0));
      setDeployedKes(sources.reduce((s, src) => s + src.principalKes, 0));
      setDeployments(deps);
      setLoading(false);
    });
  }, []);

  function loadDeployments() {
    getPoolDeployments().then(setDeployments);
  }

  const deployedSats  = Math.round(deployedKes * rate.satsPerKes);
  const availableSats = Math.max(0, poolSats - deployedSats);
  const availableKes  = availableSats * rate.kesPerSat;

  // M-Pesa tab derived values
  const kesNum  = parseFloat(kesInput.replace(/[^0-9.]/g, "")) || 0;
  const satsCost = Math.round(kesNum * rate.satsPerKes);
  const exceedsAvailable = tab === "mpesa" ? satsCost > availableSats : (parseInt(satsInput) || 0) > availableSats;

  async function onDeploy() {
    setSubmitting(true);
    try {
      let dep: PoolDeployment;
      if (tab === "mpesa") {
        dep = await deployPoolCapital("mpesa", satsCost, kesNum, destination, notes || undefined);
      } else {
        const sats = parseInt(satsInput) || 0;
        const kes  = Math.round(sats * rate.kesPerSat);
        dep = await deployPoolCapital("lightning", sats, kes, destination, notes || undefined);
      }
      setDeployed(dep);
      loadDeployments();
      // Reset form
      setKesInput(""); setSatsInput(""); setNotes("");
      setDestination(phone);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setDeployed(null);
    setDestination(phone);
  }

  const canSubmit = tab === "mpesa"
    ? kesNum > 0 && destination.trim().length > 0 && !exceedsAvailable
    : (parseInt(satsInput) || 0) > 0 && destination.trim().length > 0 && !exceedsAvailable;

  if (loading) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        <p className="note">Loading…</p>
      </div>
    );
  }

  return (
    <>
      <div className="section-head">
        <div>
          <div style={{ marginBottom: 4 }}>
            <Link href="/steward" style={{ color: "var(--soft)", fontSize: 14 }}>
              <i className="ti ti-arrow-left" /> Mlinzi
            </Link>
          </div>
          <h1 className="page-title">Deploy Capital</h1>
          <p className="page-sub">Move pool funds to a new investment.</p>
        </div>
      </div>

      {/* Pool stats */}
      <div className="grid-2">
        <div className="card">
          <div className="stat">
            <span className="l">Pool received</span>
            <span className="v">{num(poolSats)} sats</span>
          </div>
          <p className="note" style={{ marginTop: 8 }}>≈ {fmtKES(poolSats, rate, 0)} from investors</p>
        </div>
        <div className="card">
          <div className="stat">
            <span className="l">Already deployed</span>
            <span className="v">{fmtKESraw(deployedKes, 0)}</span>
          </div>
          <p className="note" style={{ marginTop: 8 }}>across {deployments.length > 0 ? `${deployments.length} deployment${deployments.length !== 1 ? "s" : ""}` : "income sources"}</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>
              Available to deploy
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: availableSats > 0 ? "var(--emerald-deep)" : "var(--soft)", marginTop: 4 }}>
              {fmtKESraw(availableKes, 0)}
            </div>
            <div className="note" style={{ marginTop: 4 }}>≈ {num(availableSats)} sats</div>
          </div>
          {availableSats <= 0 && (
            <span className="badge pending">Fully deployed</span>
          )}
        </div>
      </div>

      {/* Deploy form */}
      <div style={{ marginTop: 20 }}>
        {deployed ? (
          /* ── Success state ── */
          <div className="card" style={{ textAlign: "center", padding: "28px 20px" }}>
            <i className="ti ti-circle-check" style={{ fontSize: 44, color: "var(--emerald-deep)" }} />
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginTop: 12 }}>
              {deployed.method === "mpesa"
                ? `KES ${num(deployed.amountKes, 0)} sent via M-Pesa`
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
              <button className={tab === "mpesa" ? "on" : ""} onClick={() => { setTab("mpesa"); setDestination(phone); }}>
                <i className="ti ti-device-mobile" /> M-Pesa
              </button>
              <button className={tab === "lightning" ? "on" : ""} onClick={() => { setTab("lightning"); setDestination(""); }}>
                <i className="ti ti-bolt" /> Lightning
              </button>
            </div>

            {tab === "mpesa" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <label className="field-group">
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>Amount (KES)</span>
                  <input
                    className="amount-input"
                    inputMode="decimal"
                    placeholder="0"
                    value={kesInput}
                    onChange={(e) => setKesInput(e.target.value)}
                  />
                </label>
                {kesNum > 0 && (
                  <p className="note" style={{ textAlign: "center" }}>
                    Deploys ≈ <b>{num(satsCost)} sats</b> from pool
                    {exceedsAvailable && <span style={{ color: "var(--terracotta)", marginLeft: 6 }}>— exceeds available capital</span>}
                  </p>
                )}
                <label className="field-group">
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>Recipient phone</span>
                  <input
                    className="input"
                    type="tel"
                    placeholder="+2547XXXXXXXX"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </label>
                <label className="field-group">
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>Notes (optional)</span>
                  <input className="input" placeholder="e.g. Kilimani property deposit" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </label>
                <button
                  className="btn btn-primary"
                  disabled={!canSubmit || submitting}
                  onClick={onDeploy}
                >
                  {submitting ? "Sending…" : <><i className="ti ti-arrow-bar-up" /> Deploy via M-Pesa</>}
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <label className="field-group">
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>Lightning invoice or address</span>
                  <input
                    className="input"
                    placeholder="lnbc… or user@domain.com"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </label>
                <label className="field-group">
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>Amount (sats)</span>
                  <input
                    className="amount-input"
                    inputMode="numeric"
                    placeholder="0"
                    value={satsInput}
                    onChange={(e) => setSatsInput(e.target.value)}
                  />
                </label>
                {(parseInt(satsInput) || 0) > 0 && (
                  <p className="note" style={{ textAlign: "center" }}>
                    ≈ <b>{fmtKESraw(Math.round((parseInt(satsInput) || 0) * rate.kesPerSat), 0)}</b>
                    {exceedsAvailable && <span style={{ color: "var(--terracotta)", marginLeft: 6 }}>— exceeds available capital</span>}
                  </p>
                )}
                <label className="field-group">
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>Notes (optional)</span>
                  <input className="input" placeholder="e.g. T-bill top-up" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </label>
                <button
                  className="btn btn-primary"
                  disabled={!canSubmit || submitting}
                  onClick={onDeploy}
                >
                  {submitting ? "Sending…" : <><i className="ti ti-bolt" /> Deploy via Lightning</>}
                </button>
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
            <div
              key={d.id}
              style={{
                padding: "12px 0",
                borderBottom: i < deployments.length - 1 ? "1px solid var(--border-soft)" : "none",
                display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12,
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                  background: "var(--surface-raised)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <i className={`ti ${METHOD_ICON[d.method]}`} style={{ fontSize: 16, color: "var(--gold)" }} />
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14 }}>
                    {d.method === "mpesa" ? "M-Pesa" : "Lightning"}
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
