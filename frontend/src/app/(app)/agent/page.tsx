"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import QRScanner from "@/components/ui/QRScanner";
import TransactionRow from "@/components/app/TransactionRow";
import { useRate } from "@/lib/rate-context";
import { num, fmtKESraw } from "@/lib/format";
import {
  getAgent, getAgentHistory, agentCashTransact,
  lookupAgentCustomer, requestAgentAccessCode, verifyAgentAccessCode, agentAssistService,
  agentGenerateInvoice, agentPayInvoice,
} from "@/lib/api";
import type { AccessChannel, AgentServiceKind } from "@/lib/api";
import type { Agent, LedgerEntry } from "@/types";

const LOW_FLOAT_THRESHOLD    = 2_000_000;
const CRITICAL_FLOAT         = 500_000;
const KE_PHONE_RE            = /^(\+254|0)\d{9}$/;

type Mode   = "cash_in" | "cash_out" | "service";
type Step   = "phone" | "verify" | "details";
// Incoming → Cash | M-Pesa | Sats
// Outgoing → Cash | M-Pesa | Send  (sats label flips to "Send" on cash_out)
type Medium = "cash" | "mpesa" | "sats";

const SERVICE_OPTIONS: { kind: AgentServiceKind; label: string; hint: string }[] = [
  { kind: "savings_deposit",    label: "Savings deposit",     hint: "Add to a locked savings goal." },
  { kind: "chama_contribution", label: "Chama contribution",  hint: "Pay into a group's chama pool." },
  { kind: "withdrawal_request", label: "Withdrawal request",  hint: "File a withdrawal for Mlinzi to review." },
  { kind: "lightning_send",     label: "Send via Lightning",  hint: "Send sats on the customer's behalf." },
];

const CHANNELS: { id: AccessChannel; label: string; icon: string; hint: string }[] = [
  { id: "sms",     label: "SMS code",   icon: "ti-message", hint: "We text a one-time code to their phone." },
  { id: "email",   label: "Email code", icon: "ti-mail",    hint: "We email a one-time code." },
  { id: "offline", label: "Saved code", icon: "ti-key",     hint: "They read out a code they already have." },
];

// ── Inline error banner ───────────────────────────────────────────────────────
function ErrorNote({ msg }: { msg: string }) {
  return (
    <p className="note" style={{
      color: "var(--terra-text)", background: "rgba(185,72,50,.08)",
      border: "1px solid rgba(185,72,50,.2)", borderRadius: "var(--r-sm)",
      padding: "8px 12px",
    }}>
      <i className="ti ti-alert-circle" style={{ marginRight: 6 }} />{msg}
    </p>
  );
}

// ── Medium toggle strip ───────────────────────────────────────────────────────
function MediumToggle({
  options, value, onChange,
}: {
  options: { id: Medium; label: string; disabled?: boolean; reason?: string }[];
  value: Medium;
  onChange: (m: Medium) => void;
}) {
  return (
    <div>
      <div style={{
        display: "flex", borderRadius: "var(--r-sm)",
        border: "1px solid var(--border)", overflow: "hidden",
      }}>
        {options.map(({ id, label, disabled }, i) => (
          <button key={id}
            disabled={disabled}
            onClick={() => onChange(id)}
            style={{
              flex: 1, padding: "10px 0", textAlign: "center",
              background: value === id ? "var(--forest)" : "transparent",
              color: value === id ? "white" : disabled ? "var(--border)" : "var(--text)",
              border: "none",
              borderRight: i < options.length - 1 ? "1px solid var(--border)" : "none",
              cursor: disabled ? "not-allowed" : "pointer",
              fontSize: 13, fontWeight: value === id ? 600 : 400,
              transition: "background .15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {options.find((o) => o.id === value && o.reason) && (
        <p className="note" style={{ marginTop: 6, color: "var(--emerald-deep)" }}>
          <i className="ti ti-lock" style={{ marginRight: 4 }} />
          {options.find((o) => o.id === value)!.reason}
        </p>
      )}
      {options.find((o) => o.disabled && o.id !== value && o.reason) && (
        <p className="note" style={{ marginTop: 6 }}>
          {options.filter((o) => o.disabled).map((o) => o.reason).join(" ")}
        </p>
      )}
    </div>
  );
}

export default function AgentPage() {
  const rate = useRate();
  const [agent, setAgent]   = useState<Agent | null>(null);
  const [history, setHistory] = useState<LedgerEntry[]>([]);

  // ── flow state ──────────────────────────────────────────────────────────────
  const [mode, setMode]       = useState<Mode | null>(null);
  const [step, setStep]       = useState<Step>("phone");
  const [phone, setPhone]     = useState("");
  const [customer, setCustomer] = useState<{ phone: string; name: string | null; isMember: boolean } | null>(null);
  const [looking, setLooking] = useState(false);

  // verification
  const [channel, setChannel]     = useState<AccessChannel | null>(null);
  const [codeSent, setCodeSent]   = useState(false);
  const [code, setCode]           = useState("");
  const [verifying, setVerifying] = useState(false);

  // details
  const [medium, setMedium]       = useState<Medium>("cash");
  const [amount, setAmount]       = useState("");
  const [mpesaRef, setMpesaRef]   = useState("");       // M-Pesa number for outgoing, ref for incoming
  const [lnInvoice, setLnInvoice] = useState<string | null>(null);
  const [lnBusy, setLnBusy]       = useState(false);
  const [lnDest, setLnDest]       = useState("");
  const [scanning, setScanning]   = useState(false);
  const [serviceKind, setServiceKind] = useState<AgentServiceKind>("savings_deposit");
  const [serviceNote, setServiceNote] = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState("");

  function load() {
    getAgent().then(setAgent);
    getAgentHistory().then(setHistory);
  }
  useEffect(load, []);

  // ── helpers ─────────────────────────────────────────────────────────────────

  function toSats(value: string, m: Medium): number {
    const n = Number(value) || 0;
    return m === "sats" ? Math.round(n) : Math.round(n / rate.kesPerSat);
  }

  function fmtConversion(m: Medium): string {
    if (!amount || Number(amount) <= 0) return "";
    if (m === "sats")
      return `≈ KES ${num(Math.round(Number(amount) * rate.kesPerSat))}`;
    return `≈ ${num(toSats(amount, m))} sats`;
  }

  function commissionNote(m: Medium): string {
    if (!agent || !amount || Number(amount) <= 0) return "";
    if (m === "sats")
      return ` · commission ≈ ${num(Math.round(Number(amount) * agent.commissionRate))} sats`;
    return ` · commission ≈ ${fmtKESraw(Number(amount) * agent.commissionRate, 0)}`;
  }

  // ── medium options per step ─────────────────────────────────────────────────

  function mediumOptions(forMode: Mode, sk: AgentServiceKind) {
    const noWallet = !customer?.isMember;
    const isSend   = forMode === "cash_out";
    // lightning_send service must use sats
    const mustSats = forMode === "service" && sk === "lightning_send";

    return [
      {
        id: "cash"  as Medium,
        label: "Cash",
        disabled: mustSats,
        reason: mustSats ? "Cash can't be sent over Lightning." : undefined,
      },
      {
        id: "mpesa" as Medium,
        label: "M-Pesa",
        disabled: mustSats,
        reason: mustSats ? "M-Pesa can't be sent over Lightning." : undefined,
      },
      {
        id: "sats"  as Medium,
        label: isSend ? "Send" : "Sats",
        disabled: noWallet && !mustSats,
        reason: noWallet && !mustSats
          ? "Sats require a YeboBank wallet — this customer doesn't have one yet."
          : undefined,
      },
    ];
  }

  // ── validation ──────────────────────────────────────────────────────────────

  function phoneError(): string | null {
    if (!phone) return null;
    if (!KE_PHONE_RE.test(phone.trim()))
      return "Enter a valid Kenyan number — e.g. +254712345678 or 0712345678.";
    return null;
  }

  function detailsError(): string | null {
    if (!amount || Number(amount) <= 0)
      return "Enter an amount greater than zero.";
    if (medium === "mpesa" && mode === "cash_out" && !mpesaRef.trim())
      return "Enter the customer's M-Pesa number to send to.";
    if (medium === "mpesa" && mpesaRef && !KE_PHONE_RE.test(mpesaRef.trim()))
      return "M-Pesa number looks invalid — check the format (+254... or 07...).";
    if (medium === "sats" && mode === "cash_in" && !lnInvoice)
      return "Tap \"Generate QR\" so the customer can pay over Lightning first.";
    if (medium === "sats" && mode === "cash_out" && !lnDest.trim())
      return "Paste or scan the customer's Lightning invoice / address.";
    if (agent && medium === "cash" && mode === "cash_out" &&
        toSats(amount, medium) > agent.floatLimitSats)
      return `Amount exceeds your float (${num(agent.floatLimitSats)} sats). Top up or reduce the amount.`;
    return null;
  }

  function serviceDetailsError(): string | null {
    if (!amount || Number(amount) <= 0)
      return "Enter an amount greater than zero.";
    if (serviceKind === "lightning_send" && medium === "sats" && !lnDest.trim())
      return "Paste or scan the customer's Lightning invoice / address.";
    return null;
  }

  // ── flow control ─────────────────────────────────────────────────────────────

  function openFlow(m: Mode) {
    setMode(m); setStep("phone"); setPhone(""); setCustomer(null);
    setChannel(null); setCodeSent(false); setCode("");
    setMedium("cash"); setAmount(""); setMpesaRef("");
    setLnInvoice(null); setLnBusy(false); setLnDest(""); setScanning(false);
    setServiceKind("savings_deposit"); setServiceNote("");
    setSubmitting(false); setError("");
  }
  function closeFlow() { setMode(null); }

  // When service kind changes, auto-switch medium for lightning_send
  function changeServiceKind(k: AgentServiceKind) {
    setServiceKind(k);
    if (k === "lightning_send") setMedium("sats");
    setLnDest(""); setAmount(""); setError("");
  }

  async function doLookup() {
    const pe = phoneError();
    if (pe) { setError(pe); return; }
    setLooking(true); setError("");
    const c = await lookupAgentCustomer(phone.trim());
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
    await requestAgentAccessCode(phone.trim(), ch);
    setCodeSent(true);
  }

  async function doVerify() {
    if (!code) return;
    setVerifying(true); setError("");
    const r = await verifyAgentAccessCode(phone.trim(), code.trim());
    setVerifying(false);
    if (r.verified) setStep("details");
    else setError("That code didn't match. Double-check with the customer and try again.");
  }

  async function submitCash() {
    const err = detailsError();
    if (err) { setError(err); return; }
    if (!mode || mode === "service") return;
    setError(""); setSubmitting(true);
    const amountSats = toSats(amount, medium);
    await agentCashTransact(mode === "cash_in" ? "in" : "out", phone.trim(), amountSats);
    setSubmitting(false);
    closeFlow(); load();
  }

  async function submitService() {
    const err = serviceDetailsError();
    if (err) { setError(err); return; }
    setError(""); setSubmitting(true);
    const amountSats = toSats(amount, medium);
    if (serviceKind === "lightning_send" && medium === "sats" && lnDest) {
      await agentPayInvoice(lnDest, amountSats);
    }
    await agentAssistService(phone.trim(), serviceKind, amountSats, serviceNote || undefined);
    setSubmitting(false);
    closeFlow(); load();
  }

  async function generateInvoice() {
    if (!amount || Number(amount) <= 0) { setError("Enter an amount first."); return; }
    setError(""); setLnBusy(true);
    const res = await agentGenerateInvoice(toSats(amount, medium));
    setLnBusy(false);
    setLnInvoice(res.invoice);
  }

  async function confirmLightningCashIn() {
    if (!lnInvoice || !amount) return;
    setSubmitting(true);
    await agentCashTransact("in", phone.trim(), toSats(amount, medium));
    setSubmitting(false);
    closeFlow(); load();
  }

  async function payAndCashOut() {
    const err = detailsError();
    if (err) { setError(err); return; }
    setError(""); setSubmitting(true);
    const amountSats = toSats(amount, medium);
    await agentPayInvoice(lnDest, amountSats);
    await agentCashTransact("out", phone.trim(), amountSats);
    setSubmitting(false);
    closeFlow(); load();
  }

  // ── render ──────────────────────────────────────────────────────────────────

  if (!agent) return <p className="note">Loading…</p>;

  const floatKes      = Math.round(agent.floatLimitSats * rate.kesPerSat);
  const lowFloat      = agent.floatLimitSats < LOW_FLOAT_THRESHOLD;
  const criticalFloat = agent.floatLimitSats < CRITICAL_FLOAT;

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
          <div className="stat">
            <span className="l">Float available</span>
            <span className="v" style={{ color: criticalFloat ? "var(--terra-text)" : undefined }}>
              {num(agent.floatLimitSats)} sats
            </span>
          </div>
          <p className="note" style={{ marginTop: 8 }}>≈ KES {num(floatKes)}</p>
          {criticalFloat && (
            <p className="note" style={{ marginTop: 6, color: "var(--terra-text)", fontWeight: 600 }}>
              <i className="ti ti-alert-triangle" /> Critical — cash-out may fail. Top up now.
            </p>
          )}
          {lowFloat && !criticalFloat && (
            <p className="note" style={{ marginTop: 6, color: "var(--terra-text)" }}>
              <i className="ti ti-alert-triangle" /> Float is running low — top up soon.
            </p>
          )}
        </div>
        <div className="card">
          <div className="stat">
            <span className="l">Commission earned</span>
            <span className="v" style={{ color: "var(--emerald-deep)" }}>+{num(agent.totalEarnedSats)} sats</span>
          </div>
          <p className="note" style={{ marginTop: 8 }}>
            {(agent.commissionRate * 100).toFixed(1)}% per transaction · held in sats, protected from KES inflation
          </p>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <div className="card" style={{ textAlign: "center" }}>
          <i className="ti ti-arrow-down" style={{ fontSize: 30, color: "var(--emerald-deep)" }} />
          <h2 style={{ fontFamily: "var(--font-display)", marginTop: 10 }}>Accept money</h2>
          <p className="note" style={{ marginTop: 6 }}>
            Customer brings Cash, M-Pesa, or Sats — you credit their wallet.
          </p>
          <Button block style={{ marginTop: 14 }} onClick={() => openFlow("cash_in")}>Cash in</Button>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <i className="ti ti-arrow-up" style={{ fontSize: 30, color: "var(--terra-text)" }} />
          <h2 style={{ fontFamily: "var(--font-display)", marginTop: 10 }}>Pay out money</h2>
          <p className="note" style={{ marginTop: 6 }}>
            Customer needs Cash, M-Pesa, or Sats — you debit their wallet.
          </p>
          <Button block variant="ghost" style={{ marginTop: 14 }}
            onClick={() => openFlow("cash_out")}
            disabled={criticalFloat}
            title={criticalFloat ? "Float is critically low — top up before cash out" : undefined}
          >
            Cash out {criticalFloat && <i className="ti ti-lock" style={{ marginLeft: 6 }} />}
          </Button>
          {criticalFloat && (
            <p className="note" style={{ color: "var(--terra-text)", marginTop: 6, fontSize: 11 }}>
              Float too low for cash payouts
            </p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 18, textAlign: "center" }}>
        <i className="ti ti-headset" style={{ fontSize: 30, color: "var(--emerald-deep)" }} />
        <h2 style={{ fontFamily: "var(--font-display)", marginTop: 10 }}>Assist with a service</h2>
        <p className="note" style={{ marginTop: 6 }}>
          Help a verified YeboBank member use savings, chama, withdrawals, or Lightning — without needing their own phone.
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

      {/* ── Modal ─────────────────────────────────────────────────────────────── */}
      {mode && (
        <div className="modal-overlay" onClick={closeFlow}>
          <div className="modal" onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "90dvh", overflowY: "auto" }}>
            <button className="modal-close" onClick={closeFlow}>&times;</button>
            <h2>
              {mode === "cash_in" ? "Cash in" : mode === "cash_out" ? "Cash out" : "Assist with a service"}
              {customer?.name && <span style={{ fontWeight: 400, color: "var(--soft)", fontSize: 15 }}> — {customer.name}</span>}
            </h2>

            {/* ── Step 1: Phone lookup ──────────────────────────────────────── */}
            {step === "phone" && (
              <>
                <p className="modal-sub">
                  Enter the customer&apos;s phone number. We&apos;ll check if they&apos;re already a
                  YeboBank member and gate identity verification accordingly.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input className="input" placeholder="Customer phone (+254712... or 0712...)" value={phone}
                    onChange={(e) => { setPhone(e.target.value); setCustomer(null); setError(""); }} />
                  {phone && phoneError() && <ErrorNote msg={phoneError()!} />}
                  {error && !phoneError() && <ErrorNote msg={error} />}
                </div>
                <div className="modal-actions">
                  <Button disabled={!phone || !!phoneError() || looking} onClick={doLookup}>
                    {looking ? "Looking up…" : "Continue"}
                  </Button>
                  <Button variant="ghost" onClick={closeFlow}>Cancel</Button>
                </div>
              </>
            )}

            {/* ── Step 2: Identity verification ────────────────────────────── */}
            {step === "verify" && customer && (
              <>
                <p className="modal-sub">
                  <strong>{customer.name ?? customer.phone}</strong> has a YeboBank account.
                  Verify they&apos;re physically present before touching their wallet.
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
                      value={code} onChange={(e) => { setCode(e.target.value); setError(""); }} />
                  )}
                  {error && <ErrorNote msg={error} />}
                </div>
                <div className="modal-actions">
                  <Button disabled={!channel || !codeSent || !code || verifying} onClick={doVerify}>
                    {verifying ? "Verifying…" : "Verify & continue"}
                  </Button>
                  <Button variant="ghost" onClick={closeFlow}>Cancel</Button>
                </div>
              </>
            )}

            {/* ── Step 3a: Cash in / out ────────────────────────────────────── */}
            {step === "details" && mode !== "service" && (
              <>
                <p className="modal-sub">
                  {customer?.isMember
                    ? `Identity confirmed. Choose how the customer is ${mode === "cash_in" ? "paying" : "receiving"} and enter the amount.`
                    : "No YeboBank account on file — cash and M-Pesa only; no wallet to debit/credit."}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Medium toggle */}
                  <MediumToggle
                    value={medium}
                    options={mediumOptions(mode, serviceKind)}
                    onChange={(m) => {
                      setMedium(m);
                      setAmount(""); setLnInvoice(null); setLnDest(""); setMpesaRef(""); setError("");
                    }}
                  />

                  {/* Amount */}
                  <div>
                    <input className="input" type="number" min="0"
                      placeholder={medium === "sats" ? "Amount (sats)" : "Amount (KES)"}
                      value={amount}
                      onChange={(e) => { setAmount(e.target.value); setLnInvoice(null); setError(""); }} />
                    {amount && Number(amount) > 0 && (
                      <p className="note" style={{ marginTop: 6 }}>
                        {fmtConversion(medium)}{commissionNote(medium)}
                      </p>
                    )}
                  </div>

                  {/* M-Pesa: outgoing phone field */}
                  {medium === "mpesa" && mode === "cash_out" && (
                    <div>
                      <input className="input" placeholder="Customer's M-Pesa number (+254... or 07...)"
                        value={mpesaRef} onChange={(e) => { setMpesaRef(e.target.value); setError(""); }} />
                      <p className="note" style={{ marginTop: 4 }}>
                        Send the STK push to this number after confirming.
                      </p>
                    </div>
                  )}

                  {/* M-Pesa: incoming reference */}
                  {medium === "mpesa" && mode === "cash_in" && (
                    <p className="note" style={{ color: "var(--emerald-deep)" }}>
                      <i className="ti ti-check" /> Confirm you have received the M-Pesa before tapping Confirm.
                    </p>
                  )}

                  {/* Sats cash-in: generate invoice */}
                  {medium === "sats" && mode === "cash_in" && (
                    lnInvoice ? (
                      <div style={{ textAlign: "center", background: "var(--ivory)", borderRadius: "var(--r-sm)", padding: 16 }}>
                        <i className="ti ti-qrcode" style={{ fontSize: 48, color: "var(--forest)" }} />
                        <p className="note" style={{ marginTop: 8, wordBreak: "break-all", fontFamily: "var(--font-mono)", fontSize: 11 }}>{lnInvoice}</p>
                        <p className="note" style={{ marginTop: 6 }}>
                          Have the customer scan this to pay <strong>{num(toSats(amount, medium))} sats</strong> over Lightning.
                        </p>
                      </div>
                    ) : (
                      <Button variant="ghost" disabled={!amount || Number(amount) <= 0 || lnBusy} onClick={generateInvoice}>
                        <i className="ti ti-qrcode" /> {lnBusy ? "Generating…" : "Generate QR to receive"}
                      </Button>
                    )
                  )}

                  {/* Sats cash-out: paste / scan invoice */}
                  {medium === "sats" && mode === "cash_out" && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input className="input" style={{ flex: 1 }}
                        placeholder="Paste invoice / Lightning address"
                        value={lnDest} onChange={(e) => { setLnDest(e.target.value); setError(""); }} />
                      <button onClick={() => setScanning(true)} title="Scan QR"
                        style={{
                          background: "var(--ivory)", border: "1px solid var(--border)",
                          borderRadius: "var(--r-sm)", padding: "0 14px",
                          cursor: "pointer", color: "var(--forest)", fontSize: 18,
                          display: "flex", alignItems: "center",
                        }}>
                        <i className="ti ti-qrcode-scan" />
                      </button>
                    </div>
                  )}

                  {/* Low float warning in details */}
                  {medium === "cash" && mode === "cash_out" && lowFloat && (
                    <ErrorNote msg={`Float is low (${num(agent.floatLimitSats)} sats ≈ KES ${num(floatKes)}). Make sure you have enough physical cash on hand.`} />
                  )}

                  {error && <ErrorNote msg={error} />}
                </div>

                <div className="modal-actions">
                  {medium === "sats" && mode === "cash_in" ? (
                    <Button disabled={!lnInvoice || submitting} onClick={confirmLightningCashIn}>
                      {submitting ? "Confirming…" : "Confirm payment received"}
                    </Button>
                  ) : medium === "sats" && mode === "cash_out" ? (
                    <Button disabled={!lnDest || !amount || submitting} onClick={payAndCashOut}>
                      {submitting ? "Paying…" : "Pay & confirm cash out"}
                    </Button>
                  ) : (
                    <Button disabled={!amount || Number(amount) <= 0 || submitting} onClick={submitCash}>
                      {submitting ? "Processing…" : `Confirm ${mode === "cash_in" ? "cash in" : "cash out"}`}
                    </Button>
                  )}
                  <Button variant="ghost" onClick={closeFlow}>Cancel</Button>
                </div>
              </>
            )}

            {/* ── Step 3b: Service assist ───────────────────────────────────── */}
            {step === "details" && mode === "service" && (
              <>
                <p className="modal-sub">
                  Choose the service, how the customer is paying, and the amount.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Service picker */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {SERVICE_OPTIONS.map((s) => (
                      <button key={s.kind}
                        style={{
                          textAlign: "left", padding: 12, cursor: "pointer", background: "var(--ivory)",
                          border: `1.5px solid ${serviceKind === s.kind ? "var(--emerald-deep)" : "var(--border)"}`,
                          borderRadius: "var(--r-sm)",
                        }}
                        onClick={() => changeServiceKind(s.kind)}
                      >
                        <strong>{s.label}</strong>
                        <p className="note" style={{ marginTop: 4 }}>{s.hint}</p>
                      </button>
                    ))}
                  </div>

                  <div style={{ height: 1, background: "var(--border-soft)" }} />

                  {/* Medium toggle — lightning_send auto-locks to Sats */}
                  <MediumToggle
                    value={medium}
                    options={mediumOptions(mode, serviceKind)}
                    onChange={(m) => { setMedium(m); setLnDest(""); setAmount(""); setError(""); }}
                  />

                  {/* Amount */}
                  <div>
                    <input className="input" type="number" min="0"
                      placeholder={medium === "sats" ? "Amount (sats)" : "Amount (KES)"}
                      value={amount}
                      onChange={(e) => { setAmount(e.target.value); setError(""); }} />
                    {amount && Number(amount) > 0 && (
                      <p className="note" style={{ marginTop: 6 }}>{fmtConversion(medium)}</p>
                    )}
                  </div>

                  {/* Lightning dest for lightning_send */}
                  {serviceKind === "lightning_send" && medium === "sats" && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input className="input" style={{ flex: 1 }}
                        placeholder="Paste invoice / Lightning address"
                        value={lnDest} onChange={(e) => { setLnDest(e.target.value); setError(""); }} />
                      <button onClick={() => setScanning(true)} title="Scan QR"
                        style={{
                          background: "var(--ivory)", border: "1px solid var(--border)",
                          borderRadius: "var(--r-sm)", padding: "0 14px",
                          cursor: "pointer", color: "var(--forest)", fontSize: 18,
                          display: "flex", alignItems: "center",
                        }}>
                        <i className="ti ti-qrcode-scan" />
                      </button>
                    </div>
                  )}

                  {/* M-Pesa cash-in confirmation reminder */}
                  {medium === "mpesa" && (
                    <p className="note" style={{ color: "var(--emerald-deep)" }}>
                      <i className="ti ti-check" /> Confirm you have received the M-Pesa before submitting.
                    </p>
                  )}

                  <input className="input" placeholder="Note (optional — e.g. lock name, chama name)"
                    value={serviceNote} onChange={(e) => setServiceNote(e.target.value)} />

                  {error && <ErrorNote msg={error} />}
                </div>

                <div className="modal-actions">
                  <Button disabled={!amount || Number(amount) <= 0 || submitting} onClick={submitService}>
                    {submitting ? "Processing…" : "Confirm & assist"}
                  </Button>
                  <Button variant="ghost" onClick={closeFlow}>Cancel</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {scanning && (
        <QRScanner
          onScan={(val) => { setLnDest(val); setScanning(false); }}
          onClose={() => setScanning(false)}
        />
      )}
    </>
  );
}
