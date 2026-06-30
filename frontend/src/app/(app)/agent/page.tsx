"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import QRScanner from "@/components/ui/QRScanner";
import TransactionRow from "@/components/app/TransactionRow";
import { useRate } from "@/lib/rate-context";
import { num, fmtKESraw } from "@/lib/format";
import {
  getAgent, getAgentHistory,
  agentCashTransact, agentFiatSwap, agentTopUpFloat, confirmAgentTopUp,
  lookupAgentCustomer, requestAgentAccessCode, verifyAgentAccessCode, agentAssistService,
  agentGenerateInvoice, agentPayInvoice,
} from "@/lib/api";
import type { AccessChannel, AgentServiceKind } from "@/lib/api";
import type { Agent, LedgerEntry } from "@/types";

// ── constants ─────────────────────────────────────────────────────────────────
const LOW_FLOAT      = 2_000_000;
const CRITICAL_FLOAT = 500_000;
const KE_PHONE_RE    = /^(\+254|0)\d{9}$/;
const MOCK_APPROX_SATS_PER_KES = 13; // for preview only, actual rate from context

// ── types ─────────────────────────────────────────────────────────────────────
type Medium = "cash" | "mpesa" | "sats";
type Step   = "phone" | "verify" | "amount";

// A corridor is what the customer brings vs what they want.
interface Corridor { from: Medium; to: Medium }

const CORRIDORS: (Corridor & { label: string; fromIcon: string; toIcon: string; hint: string })[] = [
  { from: "cash",  to: "mpesa", label: "Cash → M-Pesa",  fromIcon: "ti-cash",             toIcon: "ti-device-mobile",    hint: "No YeboBank account needed." },
  { from: "mpesa", to: "cash",  label: "M-Pesa → Cash",  fromIcon: "ti-device-mobile",    toIcon: "ti-cash",             hint: "No YeboBank account needed." },
  { from: "cash",  to: "sats",  label: "Cash → Sats",    fromIcon: "ti-cash",             toIcon: "ti-currency-bitcoin", hint: "Credits the customer's wallet." },
  { from: "mpesa", to: "sats",  label: "M-Pesa → Sats",  fromIcon: "ti-device-mobile",    toIcon: "ti-currency-bitcoin", hint: "Credits the customer's wallet." },
  { from: "sats",  to: "cash",  label: "Sats → Cash",    fromIcon: "ti-currency-bitcoin", toIcon: "ti-cash",             hint: "Debits the customer's wallet." },
  { from: "sats",  to: "mpesa", label: "Sats → M-Pesa",  fromIcon: "ti-currency-bitcoin", toIcon: "ti-device-mobile",    hint: "Debits the customer's wallet." },
];

const SERVICE_OPTIONS: { kind: AgentServiceKind; label: string; hint: string }[] = [
  { kind: "savings_deposit",    label: "Savings deposit",    hint: "Add to a locked savings goal." },
  { kind: "chama_contribution", label: "Chama contribution", hint: "Pay into a group's chama pool." },
  { kind: "withdrawal_request", label: "Withdrawal request", hint: "File a withdrawal for Mlinzi to review." },
  { kind: "lightning_send",     label: "Send via Lightning", hint: "Send sats on the customer's behalf." },
];

const CHANNELS: { id: AccessChannel; label: string; icon: string; hint: string }[] = [
  { id: "sms",     label: "SMS code",   icon: "ti-message", hint: "We text a one-time code to their phone." },
  { id: "email",   label: "Email code", icon: "ti-mail",    hint: "We email a one-time code." },
  { id: "offline", label: "Saved code", icon: "ti-key",     hint: "They read out a code they already saved." },
];

const MEDIUM_COLOR: Record<Medium, string> = {
  cash:  "var(--gold)",
  mpesa: "var(--emerald-deep)",
  sats:  "#F7931A",
};
const MEDIUM_LABEL: Record<Medium, string> = { cash: "Cash", mpesa: "M-Pesa", sats: "Sats" };

function needsAccount(c: Corridor)    { return c.from === "sats" || c.to === "sats"; }
function allowsKesInput(c: Corridor)  { return c.from !== "sats"; } // sats-from always enters sats

// ── small components ──────────────────────────────────────────────────────────
function ErrNote({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <p className="note" style={{
      color: "var(--terra-text)", background: "rgba(185,72,50,.08)",
      border: "1px solid rgba(185,72,50,.2)", borderRadius: "var(--r-sm)", padding: "8px 12px",
    }}>
      <i className="ti ti-alert-circle" style={{ marginRight: 6 }} />{msg}
    </p>
  );
}

function InfoNote({ msg }: { msg: string }) {
  return (
    <p className="note" style={{
      color: "var(--emerald-deep)", background: "rgba(17,166,91,.06)",
      border: "1px solid rgba(17,166,91,.18)", borderRadius: "var(--r-sm)", padding: "8px 12px",
    }}>
      <i className="ti ti-info-circle" style={{ marginRight: 6 }} />{msg}
    </p>
  );
}

// Scan-or-paste row for Lightning addresses
function LnDestRow({ value, onChange, onScan }: { value: string; onChange: (v: string) => void; onScan: () => void }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input className="input" style={{ flex: 1 }} placeholder="Paste invoice / Lightning address"
        value={value} onChange={(e) => onChange(e.target.value)} />
      <button onClick={onScan} title="Scan QR" style={{
        background: "var(--ivory)", border: "1px solid var(--border)",
        borderRadius: "var(--r-sm)", padding: "0 14px",
        cursor: "pointer", color: "var(--forest)", fontSize: 18,
        display: "flex", alignItems: "center",
      }}>
        <i className="ti ti-qrcode-scan" />
      </button>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function AgentPage() {
  const rate = useRate();

  // ── page data ──────────────────────────────────────────────────────────────
  const [agent,   setAgent]   = useState<Agent | null>(null);
  const [history, setHistory] = useState<LedgerEntry[]>([]);

  function load() { getAgent().then(setAgent); getAgentHistory().then(setHistory); }
  useEffect(load, []);

  // ── active flow ────────────────────────────────────────────────────────────
  // null = no modal; otherwise one of three flows
  type ActiveFlow = { type: "corridor"; corridor: Corridor }
                  | { type: "service" }
                  | { type: "topup" };
  const [flow, setFlow] = useState<ActiveFlow | null>(null);

  // ── step / identity ────────────────────────────────────────────────────────
  const [step,     setStep]     = useState<Step>("amount");
  const [phone,    setPhone]    = useState("");
  const [customer, setCustomer] = useState<{ phone: string; name: string | null; isMember: boolean } | null>(null);
  const [looking,  setLooking]  = useState(false);
  const [channel,  setChannel]  = useState<AccessChannel | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [code,     setCode]     = useState("");
  const [verifying,setVerifying]= useState(false);

  // ── amount ─────────────────────────────────────────────────────────────────
  const [rawAmount, setRawAmount]   = useState("");
  const [useKes,    setUseKes]      = useState(true); // unit toggle (for sats corridors)
  const [mpesaDest, setMpesaDest]   = useState("");   // dest M-Pesa number (Cash→M-Pesa, Sats→M-Pesa)
  const [lnInvoice, setLnInvoice]   = useState<string | null>(null);
  const [lnBusy,    setLnBusy]      = useState(false);
  const [lnDest,    setLnDest]      = useState("");
  const [scanning,  setScanning]    = useState(false);

  // ── service assist ────────────────────────────────────────────────────────
  const [serviceKind, setServiceKind] = useState<AgentServiceKind>("savings_deposit");
  const [serviceNote, setServiceNote] = useState("");

  // ── top-up ─────────────────────────────────────────────────────────────────
  const [topupAmount,  setTopupAmount]  = useState("");
  const [topupInvoice, setTopupInvoice] = useState<string | null>(null);
  const [topupBusy,    setTopupBusy]    = useState(false);

  // ── shared ─────────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  // ── helpers ────────────────────────────────────────────────────────────────
  function toSats(value: string): number {
    const n = Number(value) || 0;
    return useKes ? Math.round(n / rate.kesPerSat) : Math.round(n);
  }
  function toKes(value: string): number { return Number(value) || 0; }

  function conversionNote(corridor: Corridor): string {
    if (!rawAmount || Number(rawAmount) <= 0 || !agent) return "";
    if (corridor.from === "sats" || corridor.to === "sats") {
      const sats = useKes ? toSats(rawAmount) : Number(rawAmount);
      const kes  = useKes ? Number(rawAmount) : Math.round(Number(rawAmount) * rate.kesPerSat);
      const comm = useKes
        ? fmtKESraw(kes * agent.commissionRate, 0)
        : `${num(Math.round(sats * agent.commissionRate))} sats`;
      return `≈ ${useKes ? `${num(sats)} sats` : `KES ${num(kes)}`} · commission ≈ ${comm}`;
    }
    const kes  = toKes(rawAmount);
    const comm = fmtKESraw(kes * agent.commissionRate, 0);
    return `≈ ${num(Math.round(kes / rate.kesPerSat))} sats · commission ≈ ${comm}`;
  }

  function resetDetails() {
    setRawAmount(""); setUseKes(true); setMpesaDest("");
    setLnInvoice(null); setLnBusy(false); setLnDest(""); setScanning(false);
    setServiceKind("savings_deposit"); setServiceNote("");
    setTopupAmount(""); setTopupInvoice(null); setTopupBusy(false);
    setSubmitting(false); setError("");
  }

  function resetIdentity() {
    setPhone(""); setCustomer(null); setLooking(false);
    setChannel(null); setCodeSent(false); setCode(""); setVerifying(false);
  }

  // ── open flows ─────────────────────────────────────────────────────────────
  function openCorridor(c: Corridor) {
    resetIdentity(); resetDetails();
    // sats-from defaults to sats input; others to KES
    setUseKes(c.from !== "sats");
    setStep(needsAccount(c) ? "phone" : "amount");
    setFlow({ type: "corridor", corridor: c });
  }

  function openService() {
    resetIdentity(); resetDetails();
    setStep("phone");
    setFlow({ type: "service" });
  }

  function openTopup() {
    resetDetails();
    setFlow({ type: "topup" });
  }

  function closeFlow() { setFlow(null); setError(""); }

  // ── identity steps ─────────────────────────────────────────────────────────
  function phoneErr(): string | null {
    if (!phone) return null;
    if (!KE_PHONE_RE.test(phone.trim())) return "Enter a valid Kenyan number — +254712345678 or 0712345678.";
    return null;
  }

  async function doLookup() {
    const pe = phoneErr();
    if (pe) { setError(pe); return; }
    setLooking(true); setError("");
    const c = await lookupAgentCustomer(phone.trim());
    setLooking(false); setCustomer(c);
    if (flow?.type === "service" && !c.isMember) {
      setError("This customer isn't a YeboBank member yet — offer a Cash / M-Pesa exchange instead, or help them register at yebobank.com.");
      return;
    }
    if (c.isMember) setStep("verify");
    else setStep("amount"); // cash corridors allow non-members
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
    if (r.verified) setStep("amount");
    else setError("Code didn't match — double-check with the customer and try again.");
  }

  // ── validation ─────────────────────────────────────────────────────────────
  function amountErr(corridor: Corridor): string | null {
    const n = Number(rawAmount);
    if (!rawAmount || n <= 0) return "Enter an amount greater than zero.";
    if (corridor.to === "mpesa" && !mpesaDest.trim())
      return `Enter the ${corridor.from === "cash" ? "customer's" : "destination"} M-Pesa number.`;
    if (mpesaDest && !KE_PHONE_RE.test(mpesaDest.trim()))
      return "M-Pesa number looks invalid — use +254... or 07...";
    if (corridor.to === "sats" && corridor.from !== "cash" && !lnInvoice)
      return null; // M-Pesa→Sats: no LN invoice needed (agent just credits wallet)
    if (corridor.from === "sats" && corridor.to === "cash") {
      const sats = toSats(rawAmount);
      if (agent && sats > agent.floatLimitSats)
        return `Amount exceeds your sats float (${num(agent.floatLimitSats)} sats). Top up first.`;
    }
    return null;
  }

  function serviceErr(): string | null {
    const n = Number(rawAmount);
    if (!rawAmount || n <= 0) return "Enter an amount greater than zero.";
    if (serviceKind === "lightning_send" && !lnDest.trim())
      return "Paste or scan the customer's Lightning invoice / address.";
    return null;
  }

  // ── submit handlers ────────────────────────────────────────────────────────
  async function submitCorridor(c: Corridor) {
    const err = amountErr(c);
    if (err) { setError(err); return; }
    setError(""); setSubmitting(true);

    if (c.from === "cash" && c.to === "mpesa") {
      await agentFiatSwap("cash", "mpesa", toKes(rawAmount), mpesaDest || undefined);
    } else if (c.from === "mpesa" && c.to === "cash") {
      await agentFiatSwap("mpesa", "cash", toKes(rawAmount));
    } else if (c.to === "sats") {
      // Cash→Sats or M-Pesa→Sats: agent received fiat, credits wallet
      await agentCashTransact("in", phone.trim(), toSats(rawAmount));
    } else if (c.from === "sats" && c.to === "cash") {
      // Sats→Cash: debit wallet, agent gives cash
      await agentCashTransact("out", phone.trim(), toSats(rawAmount));
    } else if (c.from === "sats" && c.to === "mpesa") {
      // Sats→M-Pesa: debit wallet, agent sends M-Pesa to mpesaDest
      if (lnDest) await agentPayInvoice(lnDest, toSats(rawAmount));
      await agentCashTransact("out", phone.trim(), toSats(rawAmount));
    }

    setSubmitting(false);
    closeFlow(); load();
  }

  async function submitService() {
    const err = serviceErr();
    if (err) { setError(err); return; }
    setError(""); setSubmitting(true);
    const sats = toSats(rawAmount);
    if (serviceKind === "lightning_send" && lnDest) await agentPayInvoice(lnDest, sats);
    await agentAssistService(phone.trim(), serviceKind, sats, serviceNote || undefined);
    setSubmitting(false);
    closeFlow(); load();
  }

  async function generateCashInInvoice() {
    if (!rawAmount || Number(rawAmount) <= 0) { setError("Enter an amount first."); return; }
    setError(""); setLnBusy(true);
    const res = await agentGenerateInvoice(toSats(rawAmount));
    setLnBusy(false); setLnInvoice(res.invoice);
  }

  async function confirmLnCashIn() {
    if (!lnInvoice || !rawAmount) return;
    setSubmitting(true);
    await agentCashTransact("in", phone.trim(), toSats(rawAmount));
    setSubmitting(false); closeFlow(); load();
  }

  async function generateTopupInvoice() {
    const n = Number(topupAmount);
    if (!n || n <= 0) { setError("Enter an amount in sats."); return; }
    setError(""); setTopupBusy(true);
    const res = await agentTopUpFloat(n);
    setTopupBusy(false); setTopupInvoice(res.invoice);
  }

  async function confirmTopup() {
    const n = Number(topupAmount);
    if (!n) return;
    setSubmitting(true);
    const updated = await confirmAgentTopUp(n);
    setAgent(updated);
    setSubmitting(false); closeFlow();
  }

  // ── render ─────────────────────────────────────────────────────────────────
  if (!agent) return <p className="note">Loading…</p>;

  const floatKes       = Math.round(agent.floatLimitSats * rate.kesPerSat);
  const criticalFloat  = agent.floatLimitSats < CRITICAL_FLOAT;
  const lowFloat       = agent.floatLimitSats < LOW_FLOAT;
  const corridor       = flow?.type === "corridor" ? flow.corridor : null;
  const noAccountFlow  = corridor && !needsAccount(corridor);

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="section-head">
        <div>
          <h1 className="page-title">Agent</h1>
          <p className="page-sub">{agent.locationName}</p>
        </div>
        <span className="badge agent">{agent.status}</span>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="stat">
            <span className="l">Sats float</span>
            <span className="v" style={{ color: criticalFloat ? "var(--terra-text)" : undefined }}>
              {num(agent.floatLimitSats)} sats
            </span>
          </div>
          <p className="note" style={{ marginTop: 6 }}>≈ KES {num(floatKes)}</p>
          {criticalFloat
            ? <p className="note" style={{ color: "var(--terra-text)", fontWeight: 600, marginTop: 6 }}><i className="ti ti-alert-triangle" /> Critical — top up now.</p>
            : lowFloat
            ? <p className="note" style={{ color: "var(--terra-text)", marginTop: 6 }}><i className="ti ti-alert-triangle" /> Float running low.</p>
            : null}
          <Button variant="ghost" style={{ marginTop: 12, width: "100%" }} onClick={openTopup}>
            <i className="ti ti-bolt" /> Top up float
          </Button>
        </div>
        <div className="card">
          <div className="stat">
            <span className="l">Commission earned</span>
            <span className="v" style={{ color: "var(--emerald-deep)" }}>+{num(agent.totalEarnedSats)} sats</span>
          </div>
          <p className="note" style={{ marginTop: 6 }}>
            {(agent.commissionRate * 100).toFixed(1)}% per transaction · held in sats, shielded from KES inflation
          </p>
          <p className="note" style={{ marginTop: 6 }}>
            M-Pesa till: <strong>{agent.mpesaTillNumber}</strong>
          </p>
        </div>
      </div>

      {/* ── Transaction corridor grid ────────────────────────────────────────── */}
      <div className="card" style={{ marginTop: 18 }}>
        <div className="section-head" style={{ marginBottom: 14 }}>
          <h2>New transaction</h2>
          <span className="note">Tap the corridor that matches the customer</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {CORRIDORS.map((c) => {
            const disabled = criticalFloat && c.from === "sats";
            return (
              <button key={`${c.from}-${c.to}`}
                disabled={disabled}
                onClick={() => openCorridor(c)}
                style={{
                  textAlign: "left", padding: "12px 14px", cursor: disabled ? "not-allowed" : "pointer",
                  background: "var(--ivory)", border: "1.5px solid var(--border)",
                  borderRadius: "var(--r-sm)", opacity: disabled ? 0.4 : 1,
                  display: "flex", flexDirection: "column", gap: 6,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <i className={`ti ${c.fromIcon}`} style={{ color: MEDIUM_COLOR[c.from], fontSize: 16 }} />
                  <i className="ti ti-arrow-right" style={{ color: "var(--soft)", fontSize: 12 }} />
                  <i className={`ti ${c.toIcon}`} style={{ color: MEDIUM_COLOR[c.to], fontSize: 16 }} />
                </div>
                <strong style={{ fontSize: 13 }}>
                  {MEDIUM_LABEL[c.from]} → {MEDIUM_LABEL[c.to]}
                </strong>
                <p className="note" style={{ margin: 0, fontSize: 11 }}>{c.hint}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Member service assist ────────────────────────────────────────────── */}
      <button className="card" style={{ marginTop: 10, width: "100%", textAlign: "left", cursor: "pointer" }}
        onClick={openService}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <strong>Assist a YeboBank member</strong>
            <p className="note" style={{ marginTop: 4 }}>
              Savings, chama contributions, withdrawals, Lightning send — identity verified first.
            </p>
          </div>
          <i className="ti ti-chevron-right" style={{ color: "var(--soft)", fontSize: 20 }} />
        </div>
      </button>

      {/* ── Recent activity ──────────────────────────────────────────────────── */}
      <div className="card" style={{ marginTop: 10 }}>
        <div className="section-head"><h2>Recent activity</h2></div>
        {history.length === 0 && <p className="note">No transactions yet today.</p>}
        {history.slice(0, 8).map((tx) => <TransactionRow key={tx.id} tx={tx} />)}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          MODALS
         ════════════════════════════════════════════════════════════════════════ */}
      {flow && (
        <div className="modal-overlay" onClick={closeFlow}>
          <div className="modal" style={{ maxHeight: "90dvh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeFlow}>&times;</button>

            {/* ── Float top-up ────────────────────────────────────────────── */}
            {flow.type === "topup" && (
              <>
                <h2><i className="ti ti-bolt" style={{ color: MEDIUM_COLOR.sats, marginRight: 8 }} />Top up sats float</h2>
                <p className="modal-sub">
                  Generate a Lightning invoice. Pay it from your personal wallet to add sats to your agent float.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input className="input" type="number" min="1" placeholder="Amount (sats)"
                    value={topupAmount} onChange={(e) => { setTopupAmount(e.target.value); setTopupInvoice(null); setError(""); }} />
                  {topupAmount && Number(topupAmount) > 0 && (
                    <p className="note">≈ KES {num(Math.round(Number(topupAmount) * rate.kesPerSat))}</p>
                  )}
                  {topupInvoice ? (
                    <div style={{ textAlign: "center", background: "var(--ivory)", borderRadius: "var(--r-sm)", padding: 16 }}>
                      <i className="ti ti-qrcode" style={{ fontSize: 56, color: "var(--forest)" }} />
                      <p className="note" style={{ marginTop: 8, wordBreak: "break-all", fontFamily: "var(--font-mono)", fontSize: 10 }}>
                        {topupInvoice}
                      </p>
                      <InfoNote msg={`Scan and pay ${num(Number(topupAmount))} sats from your Lightning wallet, then tap Confirm.`} />
                    </div>
                  ) : (
                    <Button variant="ghost" disabled={!topupAmount || Number(topupAmount) <= 0 || topupBusy}
                      onClick={generateTopupInvoice}>
                      <i className="ti ti-qrcode" /> {topupBusy ? "Generating…" : "Generate invoice"}
                    </Button>
                  )}
                  {error && <ErrNote msg={error} />}
                </div>
                <div className="modal-actions">
                  <Button disabled={!topupInvoice || submitting} onClick={confirmTopup}>
                    {submitting ? "Confirming…" : "Confirm — I've paid the invoice"}
                  </Button>
                  <Button variant="ghost" onClick={closeFlow}>Cancel</Button>
                </div>
              </>
            )}

            {/* ── Service assist ───────────────────────────────────────────── */}
            {flow.type === "service" && (
              <>
                <h2>
                  Assist a member
                  {customer?.name && <span style={{ fontWeight: 400, color: "var(--soft)", fontSize: 15 }}> — {customer.name}</span>}
                </h2>

                {step === "phone" && (
                  <>
                    <p className="modal-sub">Look up the customer's account first.</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <input className="input" placeholder="Phone (+254712... or 0712...)"
                        value={phone} onChange={(e) => { setPhone(e.target.value); setCustomer(null); setError(""); }} />
                      {phone && phoneErr() && <ErrNote msg={phoneErr()!} />}
                      {error && !phoneErr() && <ErrNote msg={error} />}
                    </div>
                    <div className="modal-actions">
                      <Button disabled={!phone || !!phoneErr() || looking} onClick={doLookup}>
                        {looking ? "Looking up…" : "Continue"}
                      </Button>
                      <Button variant="ghost" onClick={closeFlow}>Cancel</Button>
                    </div>
                  </>
                )}

                {step === "verify" && customer && (
                  <VerifyStep customer={customer} channel={channel} codeSent={codeSent} code={code}
                    error={error} verifying={verifying}
                    onSendCode={sendCode} onCodeChange={(v) => { setCode(v); setError(""); }}
                    onVerify={doVerify} onCancel={closeFlow} />
                )}

                {step === "amount" && customer && (
                  <>
                    <p className="modal-sub">
                      Choose the service and enter the amount — {customer.name}.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {SERVICE_OPTIONS.map((s) => (
                        <button key={s.kind}
                          style={{
                            textAlign: "left", padding: 12, cursor: "pointer", background: "var(--ivory)",
                            border: `1.5px solid ${serviceKind === s.kind ? "var(--emerald-deep)" : "var(--border)"}`,
                            borderRadius: "var(--r-sm)",
                          }}
                          onClick={() => { setServiceKind(s.kind); setLnDest(""); setError(""); }}
                        >
                          <strong>{s.label}</strong>
                          <p className="note" style={{ marginTop: 3 }}>{s.hint}</p>
                        </button>
                      ))}
                      <div style={{ height: 1, background: "var(--border-soft)" }} />
                      <input className="input" type="number" min="0"
                        placeholder={serviceKind === "lightning_send" ? "Amount (sats)" : "Amount (KES)"}
                        value={rawAmount} onChange={(e) => { setRawAmount(e.target.value); setError(""); }} />
                      {rawAmount && Number(rawAmount) > 0 && (
                        <p className="note">
                          {serviceKind === "lightning_send"
                            ? `≈ KES ${num(Math.round(Number(rawAmount) * rate.kesPerSat))}`
                            : `≈ ${num(Math.round(Number(rawAmount) / rate.kesPerSat))} sats`}
                        </p>
                      )}
                      {serviceKind === "lightning_send" && (
                        <LnDestRow value={lnDest} onChange={(v) => { setLnDest(v); setError(""); }}
                          onScan={() => setScanning(true)} />
                      )}
                      <input className="input" placeholder="Note (optional — lock name, chama name…)"
                        value={serviceNote} onChange={(e) => setServiceNote(e.target.value)} />
                      {error && <ErrNote msg={error} />}
                    </div>
                    <div className="modal-actions">
                      <Button disabled={!rawAmount || Number(rawAmount) <= 0 || submitting} onClick={submitService}>
                        {submitting ? "Processing…" : "Confirm & assist"}
                      </Button>
                      <Button variant="ghost" onClick={closeFlow}>Cancel</Button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── Corridor flow ────────────────────────────────────────────── */}
            {flow.type === "corridor" && corridor && (
              <>
                <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: MEDIUM_COLOR[corridor.from] }}>
                    <i className={`ti ${CORRIDORS.find(c => c.from === corridor.from && c.to === corridor.to)?.fromIcon}`} />
                  </span>
                  {MEDIUM_LABEL[corridor.from]}
                  <i className="ti ti-arrow-right" style={{ color: "var(--soft)", fontSize: 16 }} />
                  <span style={{ color: MEDIUM_COLOR[corridor.to] }}>
                    <i className={`ti ${CORRIDORS.find(c => c.from === corridor.from && c.to === corridor.to)?.toIcon}`} />
                  </span>
                  {MEDIUM_LABEL[corridor.to]}
                  {customer?.name && <span style={{ fontWeight: 400, color: "var(--soft)", fontSize: 15 }}> — {customer.name}</span>}
                </h2>

                {/* Step: phone (account-required corridors) */}
                {step === "phone" && (
                  <>
                    <p className="modal-sub">Look up the customer's YeboBank account.</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <input className="input" placeholder="Phone (+254712... or 0712...)"
                        value={phone} onChange={(e) => { setPhone(e.target.value); setCustomer(null); setError(""); }} />
                      {phone && phoneErr() && <ErrNote msg={phoneErr()!} />}
                      {error && !phoneErr() && <ErrNote msg={error} />}
                    </div>
                    <div className="modal-actions">
                      <Button disabled={!phone || !!phoneErr() || looking} onClick={doLookup}>
                        {looking ? "Looking up…" : "Continue"}
                      </Button>
                      <Button variant="ghost" onClick={closeFlow}>Cancel</Button>
                    </div>
                  </>
                )}

                {/* Step: verify */}
                {step === "verify" && customer && (
                  <VerifyStep customer={customer} channel={channel} codeSent={codeSent} code={code}
                    error={error} verifying={verifying}
                    onSendCode={sendCode} onCodeChange={(v) => { setCode(v); setError(""); }}
                    onVerify={doVerify} onCancel={closeFlow} />
                )}

                {/* Step: amount */}
                {step === "amount" && (
                  <>
                    {/* Context line */}
                    {customer && (
                      <p className="modal-sub">
                        {customer.isMember ? `Verified — ${customer.name}.` : "Guest — no YeboBank account."}
                        {" "}Enter the amount below.
                      </p>
                    )}
                    {noAccountFlow && (
                      <p className="modal-sub">Enter the amount and complete the exchange.</p>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                      {/* ── M-Pesa→Cash: show agent's till so customer knows where to send ── */}
                      {corridor.from === "mpesa" && corridor.to === "cash" && (
                        <InfoNote msg={`Ask the customer to send M-Pesa to your till: ${agent.mpesaTillNumber}`} />
                      )}

                      {/* ── Unit toggle (sats corridors only) ──────────────────────────── */}
                      {needsAccount(corridor) && (
                        <div style={{ display: "flex", borderRadius: "var(--r-sm)", border: "1px solid var(--border)", overflow: "hidden" }}>
                          {[
                            { id: true,  label: "KES" },
                            { id: false, label: corridor.from === "sats" ? "Sats (customer sends)" : "Sats" },
                          ].map(({ id, label }) => (
                            <button key={String(id)} onClick={() => { setUseKes(id); setRawAmount(""); setError(""); }}
                              style={{
                                flex: 1, padding: "9px 0", textAlign: "center", border: "none",
                                background: useKes === id ? "var(--forest)" : "transparent",
                                color: useKes === id ? "white" : "var(--text)",
                                cursor: "pointer", fontSize: 13, fontWeight: useKes === id ? 600 : 400,
                                borderRight: id ? "1px solid var(--border)" : "none",
                              }}>
                              {label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* ── Amount field ───────────────────────────────────────────────── */}
                      <div>
                        <input className="input" type="number" min="0"
                          placeholder={(!needsAccount(corridor) || useKes) ? "Amount (KES)" : "Amount (sats)"}
                          value={rawAmount}
                          onChange={(e) => { setRawAmount(e.target.value); setLnInvoice(null); setError(""); }} />
                        {rawAmount && Number(rawAmount) > 0 && (
                          <p className="note" style={{ marginTop: 6 }}>{conversionNote(corridor)}</p>
                        )}
                      </div>

                      {/* ── Cash→M-Pesa: destination M-Pesa number ────────────────────── */}
                      {corridor.to === "mpesa" && (
                        <div>
                          <input className="input" placeholder="Customer's M-Pesa number (+254... or 07...)"
                            value={mpesaDest} onChange={(e) => { setMpesaDest(e.target.value); setError(""); }} />
                          <p className="note" style={{ marginTop: 4 }}>
                            You will send M-Pesa to this number after confirming.
                          </p>
                        </div>
                      )}

                      {/* ── M-Pesa→Cash: receipt confirmation ─────────────────────────── */}
                      {corridor.from === "mpesa" && corridor.to === "cash" && (
                        <InfoNote msg="Only confirm after you see the M-Pesa credit on your phone." />
                      )}

                      {/* ── M-Pesa→Sats: receipt confirmation ─────────────────────────── */}
                      {corridor.from === "mpesa" && corridor.to === "sats" && (
                        <InfoNote msg="Confirm after M-Pesa arrives on your till. The customer's wallet will be credited immediately." />
                      )}

                      {/* ── Cash→Sats or M-Pesa→Sats: Lightning invoice option ─────────── */}
                      {(corridor.from === "cash" || corridor.from === "mpesa") && corridor.to === "sats" && !useKes && (
                        lnInvoice ? (
                          <div style={{ textAlign: "center", background: "var(--ivory)", borderRadius: "var(--r-sm)", padding: 16 }}>
                            <i className="ti ti-qrcode" style={{ fontSize: 48, color: "var(--forest)" }} />
                            <p className="note" style={{ marginTop: 8, wordBreak: "break-all", fontFamily: "var(--font-mono)", fontSize: 10 }}>{lnInvoice}</p>
                            <p className="note" style={{ marginTop: 6 }}>
                              Customer scans to pay {num(Number(rawAmount))} sats over Lightning.
                            </p>
                          </div>
                        ) : (
                          <Button variant="ghost" disabled={!rawAmount || Number(rawAmount) <= 0 || lnBusy}
                            onClick={generateCashInInvoice}>
                            <i className="ti ti-qrcode" /> {lnBusy ? "Generating…" : "Generate QR for customer to scan"}
                          </Button>
                        )
                      )}

                      {/* ── Sats→M-Pesa: Lightning scan (optional, if customer wants Lightning pay) ── */}
                      {corridor.from === "sats" && corridor.to === "mpesa" && (
                        <>
                          <p className="note" style={{ color: "var(--soft)" }}>
                            Optional: if the customer wants to pay via Lightning (rather than wallet debit), scan their invoice.
                          </p>
                          <LnDestRow value={lnDest} onChange={(v) => { setLnDest(v); setError(""); }}
                            onScan={() => setScanning(true)} />
                        </>
                      )}

                      {/* ── Low float warning for Sats→Cash ───────────────────────────── */}
                      {corridor.from === "sats" && corridor.to === "cash" && lowFloat && (
                        <ErrNote msg={`Sats float is low (${num(agent.floatLimitSats)} sats). Make sure you have enough cash on hand to pay out.`} />
                      )}

                      {error && <ErrNote msg={error} />}
                    </div>

                    <div className="modal-actions">
                      <Button disabled={!rawAmount || Number(rawAmount) <= 0 || submitting}
                        onClick={() => submitCorridor(corridor)}>
                        {submitting ? "Processing…" : `Confirm ${MEDIUM_LABEL[corridor.from]} → ${MEDIUM_LABEL[corridor.to]}`}
                      </Button>
                      <Button variant="ghost" onClick={closeFlow}>Cancel</Button>
                    </div>
                  </>
                )}
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

// ── VerifyStep — extracted to avoid duplication ───────────────────────────────
function VerifyStep({
  customer, channel, codeSent, code, error, verifying,
  onSendCode, onCodeChange, onVerify, onCancel,
}: {
  customer: { phone: string; name: string | null; isMember: boolean };
  channel: AccessChannel | null;
  codeSent: boolean;
  code: string;
  error: string;
  verifying: boolean;
  onSendCode: (ch: AccessChannel) => void;
  onCodeChange: (v: string) => void;
  onVerify: () => void;
  onCancel: () => void;
}) {
  const CHANNELS: { id: AccessChannel; label: string; icon: string; hint: string }[] = [
    { id: "sms",     label: "SMS code",   icon: "ti-message", hint: "We text a one-time code to their phone." },
    { id: "email",   label: "Email code", icon: "ti-mail",    hint: "We email a one-time code." },
    { id: "offline", label: "Saved code", icon: "ti-key",     hint: "They read out a code they already saved." },
  ];
  return (
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
            onClick={() => onSendCode(c.id)}
          >
            <strong><i className={`ti ${c.icon}`} style={{ marginRight: 8 }} />{c.label}</strong>
            <p className="note" style={{ marginTop: 4 }}>{c.hint}</p>
          </button>
        ))}
        {channel && codeSent && (
          <input className="input"
            placeholder={channel === "offline" ? "Code the customer reads out" : "One-time code from SMS / email"}
            value={code} onChange={(e) => onCodeChange(e.target.value)} />
        )}
        {error && (
          <p className="note" style={{
            color: "var(--terra-text)", background: "rgba(185,72,50,.08)",
            border: "1px solid rgba(185,72,50,.2)", borderRadius: "var(--r-sm)", padding: "8px 12px",
          }}>
            <i className="ti ti-alert-circle" style={{ marginRight: 6 }} />{error}
          </p>
        )}
      </div>
      <div className="modal-actions">
        <Button disabled={!channel || !codeSent || !code || verifying} onClick={onVerify}>
          {verifying ? "Verifying…" : "Verify & continue"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </>
  );
}
