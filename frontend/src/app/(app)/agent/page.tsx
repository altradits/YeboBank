"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import TransactionRow from "@/components/app/TransactionRow";
import { useRate } from "@/lib/rate-context";
import { num, fmtKESraw } from "@/lib/format";
import {
  getAgent, getAgentHistory, agentCashTransact,
  lookupAgentCustomer, requestAgentAccessCode, verifyAgentAccessCode, agentAssistService,
} from "@/lib/api";
import type { AccessChannel, AgentServiceKind } from "@/lib/api";
import type { Agent, LedgerEntry } from "@/types";

const LOW_FLOAT_THRESHOLD = 2_000_000;

type Mode = "cash_in" | "cash_out" | "service";
type Step = "phone" | "verify" | "details";

const SERVICE_OPTIONS: { kind: AgentServiceKind; label: string; hint: string }[] = [
  { kind: "savings_deposit",    label: "Savings deposit",     hint: "Add cash to a locked savings goal." },
  { kind: "chama_contribution", label: "Chama contribution",  hint: "Pay into a group's chama pool." },
  { kind: "withdrawal_request", label: "Withdrawal request",  hint: "File a withdrawal for Mlinzi to review." },
  { kind: "lightning_send",     label: "Send via Lightning",  hint: "Send sats out on the customer's behalf." },
];

const CHANNELS: { id: AccessChannel; label: string; icon: string; hint: string }[] = [
  { id: "sms",     label: "SMS code",   icon: "ti-message", hint: "We text a one-time code to their phone." },
  { id: "email",   label: "Email code", icon: "ti-mail",    hint: "We email a one-time code." },
  { id: "offline", label: "Saved code", icon: "ti-key",     hint: "They read out a code they already have." },
];

export default function AgentPage() {
  const rate = useRate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [history, setHistory] = useState<LedgerEntry[]>([]);

  const [mode, setMode] = useState<Mode | null>(null);
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState<{ phone: string; name: string | null; isMember: boolean } | null>(null);
  const [looking, setLooking] = useState(false);

  const [channel, setChannel] = useState<AccessChannel | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const [kes, setKes] = useState("");
  const [serviceKind, setServiceKind] = useState<AgentServiceKind>("savings_deposit");
  const [serviceNote, setServiceNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function load() {
    getAgent().then(setAgent);
    getAgentHistory().then(setHistory);
  }
  useEffect(load, []);

  function openFlow(m: Mode) {
    setMode(m); setStep("phone"); setPhone(""); setCustomer(null);
    setChannel(null); setCodeSent(false); setCode("");
    setKes(""); setServiceKind("savings_deposit"); setServiceNote("");
    setSubmitting(false); setError("");
  }
  function closeFlow() { setMode(null); }

  async function doLookup() {
    if (!phone) return;
    setLooking(true); setError("");
    const c = await lookupAgentCustomer(phone);
    setLooking(false);
    setCustomer(c);
    if (mode === "service" && !c.isMember) {
      setError("This customer isn't a YeboBank member yet — offer cash in/out instead, or help them register at yebobank.com.");
      return;
    }
    if (c.isMember) setStep("verify");
    else setStep("details");
  }

  async function sendCode(ch: AccessChannel) {
    setChannel(ch); setError("");
    await requestAgentAccessCode(phone, ch);
    setCodeSent(true);
  }

  async function doVerify() {
    if (!code) return;
    setVerifying(true); setError("");
    const r = await verifyAgentAccessCode(phone, code);
    setVerifying(false);
    if (r.verified) setStep("details");
    else setError("That code didn't match. Double-check with the customer and try again.");
  }

  async function submitCash() {
    if (!mode || mode === "service" || !kes) return;
    setSubmitting(true);
    const amountSats = Math.round((Number(kes) || 0) / rate.kesPerSat);
    await agentCashTransact(mode === "cash_in" ? "in" : "out", phone, amountSats);
    setSubmitting(false);
    closeFlow(); load();
  }

  async function submitService() {
    if (!kes) return;
    setSubmitting(true);
    const amountSats = Math.round((Number(kes) || 0) / rate.kesPerSat);
    await agentAssistService(phone, serviceKind, amountSats, serviceNote || undefined);
    setSubmitting(false);
    closeFlow(); load();
  }

  if (!agent) return <p className="note">Loading…</p>;

  const lowFloat = agent.floatLimitSats < LOW_FLOAT_THRESHOLD;

  return (
    <>
      <div className="section-head">
        <div>
          <h1 className="page-title">Agent</h1>
          <p className="page-sub">{agent.locationName}</p>
        </div>
        <span className="badge agent">{agent.status}</span>
      </div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="stat"><span className="l">Float available</span><span className="v">{num(agent.floatLimitSats)} sats</span></div>
          <p className="note" style={{ marginTop: 8 }}>≈ KES {num(agent.floatLimitSats * rate.kesPerSat)}</p>
          {lowFloat && (
            <p className="note" style={{ marginTop: 6, color: "var(--terra-text)" }}>
              <i className="ti ti-alert-triangle" /> Float is running low — top up to keep serving cash-in requests.
            </p>
          )}
        </div>
        <div className="card">
          <div className="stat"><span className="l">Commission earned</span><span className="v" style={{ color: "var(--emerald-deep)" }}>+{num(agent.totalEarnedSats)} sats</span></div>
          <p className="note" style={{ marginTop: 8 }}>{(agent.commissionRate * 100).toFixed(1)}% per transaction · held in sats, protected from KES inflation</p>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <div className="card" style={{ textAlign: "center" }}>
          <i className="ti ti-arrow-down" style={{ fontSize: 30, color: "var(--emerald-deep)" }} />
          <h2 style={{ fontFamily: "var(--font-display)", marginTop: 10 }}>Accept cash</h2>
          <p className="note" style={{ marginTop: 6 }}>Take cash from anyone — member or not — and credit their wallet.</p>
          <Button block style={{ marginTop: 14 }} onClick={() => openFlow("cash_in")}>Cash in</Button>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <i className="ti ti-arrow-up" style={{ fontSize: 30, color: "var(--terra-text)" }} />
          <h2 style={{ fontFamily: "var(--font-display)", marginTop: 10 }}>Pay out cash</h2>
          <p className="note" style={{ marginTop: 6 }}>Give a customer cash and debit their wallet.</p>
          <Button block variant="ghost" style={{ marginTop: 14 }} onClick={() => openFlow("cash_out")}>Cash out</Button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18, textAlign: "center" }}>
        <i className="ti ti-headset" style={{ fontSize: 30, color: "var(--emerald-deep)" }} />
        <h2 style={{ fontFamily: "var(--font-display)", marginTop: 10 }}>Assist with a service</h2>
        <p className="note" style={{ marginTop: 6 }}>
          Help a YeboBank member use a service they&apos;re already part of — savings, chama, withdrawals,
          Lightning — without needing their own phone. Identity is verified first.
        </p>
        <Button block style={{ marginTop: 14, maxWidth: 320, margin: "14px auto 0" }} onClick={() => openFlow("service")}>
          Assist a customer
        </Button>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="section-head"><h2>Recent activity</h2></div>
        {history.length === 0 && <p className="note">No transactions yet today.</p>}
        {history.slice(0, 8).map((tx) => <TransactionRow key={tx.id} tx={tx} />)}
      </div>

      {mode && (
        <div className="modal-overlay" onClick={closeFlow}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeFlow}>&times;</button>
            <h2>
              {mode === "cash_in" ? "Cash in" : mode === "cash_out" ? "Cash out" : "Assist with a service"} — customer
            </h2>

            {/* Step 1: Phone lookup */}
            {step === "phone" && (
              <>
                <p className="modal-sub">
                  Enter the customer&apos;s phone number. We&apos;ll check whether they have a YeboBank account so
                  we know if their identity needs verifying first.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input className="input" placeholder="Customer phone (+254...)" value={phone}
                    onChange={(e) => { setPhone(e.target.value); setCustomer(null); setError(""); }} />
                  {error && <p className="note" style={{ color: "var(--red)" }}>{error}</p>}
                </div>
                <div className="modal-actions">
                  <Button disabled={!phone || looking} onClick={doLookup}>
                    {looking ? "Looking up…" : "Continue"}
                  </Button>
                  <Button variant="ghost" onClick={closeFlow}>Cancel</Button>
                </div>
              </>
            )}

            {/* Step 2: Identity verification (members only) */}
            {step === "verify" && customer && (
              <>
                <p className="modal-sub">
                  {customer.name ?? "This customer"} has a YeboBank account. Verify they&apos;re really here —
                  pick how they&apos;d like to confirm their identity.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {CHANNELS.map((c) => (
                    <button key={c.id}
                      style={{
                        textAlign: "left", padding: 12, cursor: "pointer", background: "var(--ivory)",
                        border: `1.5px solid ${channel === c.id ? "var(--emerald-deep)" : "var(--border)"}`,
                        borderRadius: "var(--r-sm)",
                      }}
                      onClick={() => sendCode(c.id)}
                    >
                      <strong><i className={`ti ${c.icon}`} style={{ marginRight: 8 }} />{c.label}</strong>
                      <p className="note" style={{ marginTop: 4 }}>{c.hint}</p>
                    </button>
                  ))}
                  {channel && codeSent && (
                    <input className="input"
                      placeholder={channel === "offline" ? "Code the customer reads out" : "One-time code from SMS / email"}
                      value={code} onChange={(e) => setCode(e.target.value)} />
                  )}
                  {error && <p className="note" style={{ color: "var(--red)" }}>{error}</p>}
                </div>
                <div className="modal-actions">
                  <Button disabled={!channel || !codeSent || !code || verifying} onClick={doVerify}>
                    {verifying ? "Verifying…" : "Verify & continue"}
                  </Button>
                  <Button variant="ghost" onClick={closeFlow}>Cancel</Button>
                </div>
              </>
            )}

            {/* Step 3a: Cash in / out amount */}
            {step === "details" && mode !== "service" && (
              <>
                <p className="modal-sub">
                  {customer?.isMember
                    ? `Verified — ${customer.name}. Enter the amount.`
                    : "No YeboBank account on file — cash-only transaction, no account to protect."}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input className="input" type="number" placeholder="Amount (KES)" value={kes}
                    onChange={(e) => setKes(e.target.value)} />
                  {kes && (
                    <p className="note">
                      ≈ {num(Math.round((Number(kes) || 0) / rate.kesPerSat))} sats
                      {" · "}commission ≈ {fmtKESraw((Number(kes) || 0) * agent.commissionRate, 0)}
                    </p>
                  )}
                </div>
                <div className="modal-actions">
                  <Button disabled={!kes || submitting} onClick={submitCash}>
                    {submitting ? "Processing…" : `Confirm ${mode === "cash_in" ? "cash in" : "cash out"}`}
                  </Button>
                  <Button variant="ghost" onClick={closeFlow}>Cancel</Button>
                </div>
              </>
            )}

            {/* Step 3b: Service assist details */}
            {step === "details" && mode === "service" && (
              <>
                <p className="modal-sub">Verified — {customer?.name}. Choose what to help them do.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {SERVICE_OPTIONS.map((s) => (
                    <button key={s.kind}
                      style={{
                        textAlign: "left", padding: 12, cursor: "pointer", background: "var(--ivory)",
                        border: `1.5px solid ${serviceKind === s.kind ? "var(--emerald-deep)" : "var(--border)"}`,
                        borderRadius: "var(--r-sm)",
                      }}
                      onClick={() => setServiceKind(s.kind)}
                    >
                      <strong>{s.label}</strong>
                      <p className="note" style={{ marginTop: 4 }}>{s.hint}</p>
                    </button>
                  ))}
                  <input className="input" type="number" placeholder="Amount (KES)" value={kes}
                    onChange={(e) => setKes(e.target.value)} />
                  <input className="input" placeholder="Note (optional — e.g. lock or chama name)" value={serviceNote}
                    onChange={(e) => setServiceNote(e.target.value)} />
                  {kes && <p className="note">≈ {num(Math.round((Number(kes) || 0) / rate.kesPerSat))} sats</p>}
                </div>
                <div className="modal-actions">
                  <Button disabled={!kes || submitting} onClick={submitService}>
                    {submitting ? "Processing…" : "Confirm & assist"}
                  </Button>
                  <Button variant="ghost" onClick={closeFlow}>Cancel</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
