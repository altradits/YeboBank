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

// ─────────────────────────────────────────────────────────────────────────────
// Constants & types
// ─────────────────────────────────────────────────────────────────────────────
const LOW_FLOAT      = 2_000_000;
const CRITICAL_FLOAT = 500_000;
const KE_PHONE_RE    = /^(\+254|0)\d{9}$/;

/** Top-level customer mode the agent is in */
type Mode = null | "guest" | "member";

/** Verified member context — persists across multiple transactions */
interface MemberCtx { phone: string; name: string | null; verified: boolean }

/**
 * Discriminated union of every transaction the agent can perform.
 * Each variant carries exactly what it needs.
 */
type Tx =
  // ── Guest (no YeboBank wallet) ────────────────────────────────────────────
  | { t: "g_cash_mpesa" }                         // 1. Cash → M-Pesa
  | { t: "g_mpesa_cash" }                         // 2. M-Pesa → Cash
  | { t: "g_cash_ln" }                            // 3. Cash → Lightning (via agent wallet)
  | { t: "g_mpesa_ln" }                           // 4. M-Pesa → Lightning (via agent wallet)
  | { t: "g_ln_cash" }                            // 5. Lightning → Cash (via agent wallet)
  | { t: "g_ln_mpesa" }                           // 6. Lightning → M-Pesa (via agent wallet)
  // ── Member deposits (no verification required — money goes IN) ─────────
  | { t: "m_dep_cash" }                           // 7. Cash → member wallet
  | { t: "m_dep_mpesa" }                          // 8. M-Pesa → member wallet
  | { t: "m_dep_ln" }                             // 9. Lightning → member wallet
  // ── Member withdrawals (verification required — money goes OUT) ────────
  | { t: "m_wdraw_cash" }                         // 10. Member wallet → Cash
  | { t: "m_wdraw_mpesa" }                        // 11. Member wallet → M-Pesa
  | { t: "m_wdraw_ln" }                           // 12. Member wallet → Lightning
  // ── Member services (verification required) ────────────────────────────
  | { t: "m_svc"; kind: AgentServiceKind }        // 13-16. Savings / Chama / Withdrawal / LN send
  // ── Agent own ──────────────────────────────────────────────────────────
  | { t: "topup" }                                // 17. Agent float top-up
  // ── Post-deposit forwarding ────────────────────────────────────────────
  | { t: "post_dep"; sats: number };              // after deposit: keep / forward options

const CHANNELS: { id: AccessChannel; label: string; icon: string; hint: string }[] = [
  { id: "sms",     label: "SMS code",   icon: "ti-message", hint: "One-time code sent to their phone." },
  { id: "email",   label: "Email code", icon: "ti-mail",    hint: "One-time code sent to their email." },
  { id: "offline", label: "Saved code", icon: "ti-key",     hint: "A code the customer memorized or wrote down." },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tiny UI helpers
// ─────────────────────────────────────────────────────────────────────────────
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

function GoodNote({ msg }: { msg: string }) {
  return (
    <p className="note" style={{
      color: "var(--emerald-deep)", background: "rgba(17,166,91,.07)",
      border: "1px solid rgba(17,166,91,.2)", borderRadius: "var(--r-sm)", padding: "8px 12px",
    }}>
      <i className="ti ti-circle-check" style={{ marginRight: 6 }} />{msg}
    </p>
  );
}

function ScanRow({ value, onChange, onScan, placeholder = "Paste invoice / Lightning address" }: {
  value: string; onChange: (v: string) => void; onScan: () => void; placeholder?: string;
}) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input className="input" style={{ flex: 1 }} placeholder={placeholder}
        value={value} onChange={(e) => onChange(e.target.value)} />
      <button onClick={onScan} title="Scan QR" style={{
        background: "var(--ivory)", border: "1px solid var(--border)",
        borderRadius: "var(--r-sm)", padding: "0 14px",
        cursor: "pointer", color: "var(--forest)", fontSize: 18, display: "flex", alignItems: "center",
      }}>
        <i className="ti ti-qrcode-scan" />
      </button>
    </div>
  );
}

function UnitToggle({ useKes, onToggle, satLabel = "Sats" }: {
  useKes: boolean; onToggle: (b: boolean) => void; satLabel?: string;
}) {
  return (
    <div style={{ display: "flex", borderRadius: "var(--r-sm)", border: "1px solid var(--border)", overflow: "hidden" }}>
      {[{ id: true, label: "KES" }, { id: false, label: satLabel }].map(({ id, label }) => (
        <button key={String(id)} onClick={() => onToggle(id)} style={{
          flex: 1, padding: "9px 0", textAlign: "center", border: "none",
          background: useKes === id ? "var(--forest)" : "transparent",
          color: useKes === id ? "white" : "var(--text)",
          cursor: "pointer", fontSize: 13, fontWeight: useKes === id ? 600 : 400,
          borderRight: id ? "1px solid var(--border)" : "none",
        }}>{label}</button>
      ))}
    </div>
  );
}

function InvoiceQR({ invoice, amountSats, onCopy }: { invoice: string; amountSats: number; onCopy?: () => void }) {
  return (
    <div style={{ textAlign: "center", background: "var(--ivory)", borderRadius: "var(--r-sm)", padding: 16 }}>
      <i className="ti ti-qrcode" style={{ fontSize: 56, color: "var(--forest)" }} />
      <p className="note" style={{ marginTop: 8, wordBreak: "break-all", fontFamily: "var(--font-mono)", fontSize: 10 }}>
        {invoice}
      </p>
      <p className="note" style={{ marginTop: 6 }}>
        Customer pays <strong>{num(amountSats)} sats</strong> by scanning this QR with their Lightning wallet.
      </p>
      {onCopy && (
        <button onClick={onCopy} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--soft)", fontSize: 12, marginTop: 4 }}>
          <i className="ti ti-copy" /> Copy invoice
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Verify step (reused for member withdrawals / services)
// ─────────────────────────────────────────────────────────────────────────────
function VerifyStep({ member, channel, codeSent, code, error, verifying, onSendCode, onCodeChange, onVerify, onCancel }: {
  member: MemberCtx;
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
  return (
    <>
      <p className="modal-sub">
        <strong>{member.name ?? member.phone}</strong> has a YeboBank account.
        Confirm they&apos;re physically present before touching their wallet.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {CHANNELS.map((c) => (
          <button key={c.id} style={{
            textAlign: "left", padding: 12, cursor: "pointer", background: "var(--ivory)",
            border: `1.5px solid ${channel === c.id ? "var(--emerald-deep)" : "var(--border)"}`,
            borderRadius: "var(--r-sm)",
          }} onClick={() => onSendCode(c.id)}>
            <strong><i className={`ti ${c.icon}`} style={{ marginRight: 8 }} />{c.label}</strong>
            <p className="note" style={{ marginTop: 3 }}>{c.hint}</p>
          </button>
        ))}
        {channel && codeSent && (
          <input className="input"
            placeholder={channel === "offline" ? "Code the customer reads out" : "One-time code from SMS / email"}
            value={code} onChange={(e) => onCodeChange(e.target.value)} />
        )}
        {error && <ErrNote msg={error} />}
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

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function AgentPage() {
  const rate = useRate();

  // ── page data ──
  const [agent,   setAgent]   = useState<Agent | null>(null);
  const [history, setHistory] = useState<LedgerEntry[]>([]);
  function load() { getAgent().then(setAgent); getAgentHistory().then(setHistory); }
  useEffect(load, []);

  // ── customer context ──
  const [mode,   setMode]   = useState<Mode>(null);
  const [member, setMember] = useState<MemberCtx | null>(null);

  // member lookup state
  const [phone,    setPhone]    = useState("");
  const [looking,  setLooking]  = useState(false);
  const [lookErr,  setLookErr]  = useState("");

  // verification state (for withdrawals / services)
  const [channel,   setChannel]   = useState<AccessChannel | null>(null);
  const [codeSent,  setCodeSent]  = useState(false);
  const [code,      setCode]      = useState("");
  const [verifying, setVerifying] = useState(false);

  // ── active transaction ──
  const [tx, setTx] = useState<Tx | null>(null);

  // form fields (shared across tx types)
  const [rawAmount,  setRawAmount]  = useState("");
  const [useKes,     setUseKes]     = useState(true);
  const [mpesaDest,  setMpesaDest]  = useState("");  // outgoing M-Pesa #
  const [mpesaRef,   setMpesaRef]   = useState("");  // incoming M-Pesa reference code
  const [lnInvoice,  setLnInvoice]  = useState<string | null>(null);
  const [lnBusy,     setLnBusy]     = useState(false);
  const [lnDest,     setLnDest]     = useState("");
  const [scanning,   setScanning]   = useState(false);
  const [receiptOk,  setReceiptOk]  = useState(false);  // agent confirms M-Pesa receipt
  const [topupInv,   setTopupInv]   = useState<string | null>(null);
  const [topupBusy,  setTopupBusy]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [txErr,      setTxErr]      = useState("");

  // verification pending for current tx
  const [needsVerify, setNeedsVerify] = useState(false);

  // ── helpers ──
  function toSats(val: string): number {
    const n = Number(val) || 0;
    return useKes ? Math.round(n / rate.kesPerSat) : Math.round(n);
  }
  function toKes(val: string): number { return Number(val) || 0; }

  function preview(): string {
    if (!rawAmount || Number(rawAmount) <= 0 || !agent) return "";
    if (useKes) {
      const sats = toSats(rawAmount);
      return `≈ ${num(sats)} sats · commission ≈ ${fmtKESraw(toKes(rawAmount) * agent.commissionRate, 0)}`;
    }
    const kes = Math.round(Number(rawAmount) * rate.kesPerSat);
    return `≈ KES ${num(kes)} · commission ≈ ${num(Math.round(Number(rawAmount) * agent.commissionRate))} sats`;
  }

  function phoneErr(p: string): string | null {
    if (!p) return null;
    return KE_PHONE_RE.test(p.trim()) ? null : "Enter a valid Kenyan number — +254712345678 or 0712345678.";
  }

  function resetTxFields() {
    setRawAmount(""); setUseKes(true);
    setMpesaDest(""); setMpesaRef(""); setReceiptOk(false);
    setLnInvoice(null); setLnBusy(false); setLnDest(""); setScanning(false);
    setTopupInv(null); setTopupBusy(false);
    setSubmitting(false); setTxErr("");
    setNeedsVerify(false);
    setChannel(null); setCodeSent(false); setCode(""); setVerifying(false);
  }

  function openTx(t: Tx) {
    resetTxFields();
    // withdrawals and services require verification if not yet done
    const needsV = !member?.verified && (
      t.t === "m_wdraw_cash" || t.t === "m_wdraw_mpesa" || t.t === "m_wdraw_ln" || t.t === "m_svc"
    );
    setNeedsVerify(needsV);
    // sats-native tx default to sats input
    if (t.t === "g_ln_cash" || t.t === "g_ln_mpesa" || t.t === "m_dep_ln" || t.t === "m_wdraw_ln") setUseKes(false);
    setTx(t);
  }
  function closeTx() { setTx(null); setTxErr(""); }

  function resetMember() {
    setMember(null); setPhone(""); setLookErr(""); setLooking(false);
    setChannel(null); setCodeSent(false); setCode(""); setVerifying(false);
  }

  // ── member lookup ──
  async function doLookup() {
    const pe = phoneErr(phone);
    if (pe) { setLookErr(pe); return; }
    setLooking(true); setLookErr("");
    const c = await lookupAgentCustomer(phone.trim());
    setLooking(false);
    if (c.isMember) {
      setMember({ phone: c.phone, name: c.name, verified: false });
    } else {
      setLookErr("No YeboBank account found for that number. You can serve them as a guest, or help them register at yebobank.com.");
    }
  }

  // ── verification (lazy — only when tx requires it) ──
  async function sendCode(ch: AccessChannel) {
    if (!member) return;
    setChannel(ch); setTxErr("");
    await requestAgentAccessCode(member.phone, ch);
    setCodeSent(true);
  }

  async function doVerify() {
    if (!member || !code) return;
    setVerifying(true); setTxErr("");
    const r = await verifyAgentAccessCode(member.phone, code.trim());
    setVerifying(false);
    if (r.verified) {
      setMember({ ...member, verified: true });
      setNeedsVerify(false);
    } else {
      setTxErr("Code didn't match — double-check with the customer and try again.");
    }
  }

  // ── submit logic per tx type ──
  async function handleSubmit() {
    if (!tx || !agent) return;

    // Quick field validations
    const n = Number(rawAmount);
    if (!rawAmount || n <= 0) { setTxErr("Enter an amount greater than zero."); return; }

    const sats = toSats(rawAmount);
    const kes  = useKes ? n : Math.round(n * rate.kesPerSat);

    // Destination / receipt checks
    if ((tx.t === "g_cash_mpesa" || tx.t === "g_ln_mpesa" || tx.t === "m_wdraw_mpesa") && !mpesaDest.trim()) {
      setTxErr("Enter the destination M-Pesa number."); return;
    }
    if (mpesaDest && !KE_PHONE_RE.test(mpesaDest.trim())) {
      setTxErr("M-Pesa number format looks wrong — use +254... or 07..."); return;
    }
    if ((tx.t === "g_cash_ln" || tx.t === "g_mpesa_ln" || tx.t === "m_wdraw_ln" ||
         (tx.t === "m_svc" && tx.kind === "lightning_send")) && !lnDest.trim()) {
      setTxErr("Paste or scan the Lightning invoice / address."); return;
    }
    if ((tx.t === "g_mpesa_cash" || tx.t === "g_mpesa_ln" || tx.t === "m_dep_mpesa") && !receiptOk) {
      setTxErr("Confirm you have received the M-Pesa before proceeding."); return;
    }
    if ((tx.t === "g_ln_cash" || tx.t === "g_ln_mpesa" || tx.t === "m_dep_ln") && !lnInvoice) {
      setTxErr("Generate the invoice QR and wait for the customer to pay first."); return;
    }
    if (tx.t === "m_wdraw_cash" && sats > agent.floatLimitSats) {
      setTxErr(`Amount exceeds your sats float (${num(agent.floatLimitSats)} sats ≈ KES ${num(Math.round(agent.floatLimitSats * rate.kesPerSat))}). Top up first.`); return;
    }

    setTxErr(""); setSubmitting(true);
    try {
      switch (tx.t) {
        // ── Guest fiat swaps ──────────────────────────────────────────────────
        case "g_cash_mpesa":
          await agentFiatSwap("cash", "mpesa", kes, mpesaDest);
          break;
        case "g_mpesa_cash":
          await agentFiatSwap("mpesa", "cash", kes, mpesaRef || undefined);
          break;
        // ── Guest Lightning via agent wallet ─────────────────────────────────
        case "g_cash_ln":
        case "g_mpesa_ln":
          // Agent's wallet sends to customer's external Lightning address
          await agentPayInvoice(lnDest, sats);
          if (tx.t === "g_mpesa_ln") {
            await agentFiatSwap("mpesa", "cash", kes, mpesaRef || undefined); // log M-Pesa receipt
          }
          break;
        case "g_ln_cash":
          // Invoice already generated and paid; just log the cash-out
          await agentCashTransact("in", "guest", sats);
          break;
        case "g_ln_mpesa":
          // Invoice paid; agent sends M-Pesa to dest
          await agentCashTransact("in", "guest", sats);
          break;
        // ── Member deposits ───────────────────────────────────────────────────
        case "m_dep_cash":
          await agentCashTransact("in", member!.phone, sats);
          setTx({ t: "post_dep", sats });
          setSubmitting(false);
          return;
        case "m_dep_mpesa":
          await agentCashTransact("in", member!.phone, Math.round(kes / rate.kesPerSat));
          setTx({ t: "post_dep", sats: Math.round(kes / rate.kesPerSat) });
          setSubmitting(false);
          return;
        case "m_dep_ln":
          await agentCashTransact("in", member!.phone, sats);
          setTx({ t: "post_dep", sats });
          setSubmitting(false);
          return;
        // ── Member withdrawals ────────────────────────────────────────────────
        case "m_wdraw_cash":
          await agentCashTransact("out", member!.phone, sats);
          break;
        case "m_wdraw_mpesa":
          await agentCashTransact("out", member!.phone, sats);
          break;
        case "m_wdraw_ln":
          await agentCashTransact("out", member!.phone, sats);
          await agentPayInvoice(lnDest, sats);
          break;
        // ── Member services ────────────────────────────────────────────────────
        case "m_svc":
          if (tx.kind === "lightning_send") await agentPayInvoice(lnDest, sats);
          await agentAssistService(member!.phone, tx.kind, sats);
          break;
        default:
          break;
      }
      closeTx(); load();
    } catch {
      setTxErr("Transaction failed — please try again.");
    }
    setSubmitting(false);
  }

  async function genInvoice() {
    if (!rawAmount || Number(rawAmount) <= 0) { setTxErr("Enter an amount first."); return; }
    setTxErr(""); setLnBusy(true);
    const res = await agentGenerateInvoice(toSats(rawAmount));
    setLnBusy(false); setLnInvoice(res.invoice);
  }

  async function genTopup() {
    const n = Number(rawAmount);
    if (!n || n <= 0) { setTxErr("Enter sats amount."); return; }
    setTxErr(""); setTopupBusy(true);
    const res = await agentTopUpFloat(Math.round(n));
    setTopupBusy(false); setTopupInv(res.invoice);
  }

  async function confirmTopup() {
    const n = Number(rawAmount);
    if (!n) return;
    setSubmitting(true);
    const updated = await confirmAgentTopUp(Math.round(n));
    setAgent(updated);
    setSubmitting(false); closeTx(); load();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  if (!agent) return <p className="note">Loading…</p>;

  const floatKes       = Math.round(agent.floatLimitSats * rate.kesPerSat);
  const criticalFloat  = agent.floatLimitSats < CRITICAL_FLOAT;
  const lowFloat       = agent.floatLimitSats < LOW_FLOAT;

  // ── tile helper ──
  function Tile({ icon, color, label, sub, onClick, warn }: {
    icon: string; color: string; label: string; sub?: string;
    onClick: () => void; warn?: boolean;
  }) {
    return (
      <button onClick={onClick} style={{
        textAlign: "left", padding: "12px 14px", cursor: "pointer",
        background: warn ? "rgba(185,72,50,.04)" : "var(--ivory)",
        border: `1.5px solid ${warn ? "rgba(185,72,50,.25)" : "var(--border)"}`,
        borderRadius: "var(--r-sm)", display: "flex", flexDirection: "column", gap: 5,
      }}>
        <i className={`ti ${icon}`} style={{ color, fontSize: 20 }} />
        <strong style={{ fontSize: 13 }}>{label}</strong>
        {sub && <p className="note" style={{ margin: 0, fontSize: 11 }}>{sub}</p>}
      </button>
    );
  }

  return (
    <>
      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="section-head" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Agent</h1>
          <p className="page-sub">{agent.locationName}</p>
        </div>
        <span className="badge agent">{agent.status}</span>
      </div>

      <div className="grid-2" style={{ marginTop: 14 }}>
        <div className="card">
          <div className="stat">
            <span className="l">Sats float</span>
            <span className="v" style={{ color: criticalFloat ? "var(--terra-text)" : undefined }}>
              {num(agent.floatLimitSats)} sats
            </span>
          </div>
          <p className="note" style={{ marginTop: 5 }}>≈ KES {num(floatKes)}</p>
          {criticalFloat && <p className="note" style={{ color: "var(--terra-text)", fontWeight: 600, marginTop: 5 }}><i className="ti ti-alert-triangle" /> Critical — top up now.</p>}
          {lowFloat && !criticalFloat && <p className="note" style={{ color: "var(--terra-text)", marginTop: 5 }}><i className="ti ti-alert-triangle" /> Float running low.</p>}
          <Button variant="ghost" style={{ marginTop: 10, width: "100%", fontSize: 13 }} onClick={() => openTx({ t: "topup" })}>
            <i className="ti ti-bolt" /> Top up float
          </Button>
        </div>
        <div className="card">
          <div className="stat">
            <span className="l">Commission earned</span>
            <span className="v" style={{ color: "var(--emerald-deep)" }}>+{num(agent.totalEarnedSats)} sats</span>
          </div>
          <p className="note" style={{ marginTop: 5 }}>{(agent.commissionRate * 100).toFixed(1)}% per transaction · held in sats</p>
          <p className="note" style={{ marginTop: 5 }}>M-Pesa till: <strong>{agent.mpesaTillNumber}</strong></p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          HOME — choose who to serve
          ══════════════════════════════════════════════════════════════════════ */}
      {mode === null && (
        <div className="card" style={{ marginTop: 14, textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, marginBottom: 16 }}>
            Who are you serving?
          </p>
          <div className="grid-2" style={{ gap: 10 }}>
            <button onClick={() => setMode("guest")} style={{
              padding: 20, cursor: "pointer", background: "var(--ivory)", border: "1.5px solid var(--border)",
              borderRadius: "var(--r-md)", textAlign: "center",
            }}>
              <i className="ti ti-user" style={{ fontSize: 28, color: "var(--gold)", display: "block", marginBottom: 8 }} />
              <strong>Guest</strong>
              <p className="note" style={{ marginTop: 4 }}>No YeboBank account</p>
            </button>
            <button onClick={() => setMode("member")} style={{
              padding: 20, cursor: "pointer", background: "var(--ivory)", border: "1.5px solid var(--border)",
              borderRadius: "var(--r-md)", textAlign: "center",
            }}>
              <i className="ti ti-wallet" style={{ fontSize: 28, color: "var(--emerald-deep)", display: "block", marginBottom: 8 }} />
              <strong>Member</strong>
              <p className="note" style={{ marginTop: 4 }}>Has a YeboBank wallet</p>
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          GUEST DASHBOARD
          ══════════════════════════════════════════════════════════════════════ */}
      {mode === "guest" && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="section-head" style={{ marginBottom: 14 }}>
            <div>
              <h2>Guest transactions</h2>
              <p className="note">No YeboBank account needed for any of these.</p>
            </div>
            <button onClick={() => setMode(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--soft)", fontSize: 13 }}>
              ← Back
            </button>
          </div>

          <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, marginBottom: 8, color: "var(--soft)" }}>CASH & M-PESA EXCHANGE</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <Tile icon="ti-cash" color="var(--gold)" label="Cash → M-Pesa"
              sub="Give cash, receive M-Pesa" onClick={() => openTx({ t: "g_cash_mpesa" })} />
            <Tile icon="ti-device-mobile" color="var(--emerald-deep)" label="M-Pesa → Cash"
              sub="Send M-Pesa, receive cash" onClick={() => openTx({ t: "g_mpesa_cash" })} />
          </div>

          <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, marginBottom: 8, color: "var(--soft)" }}>BITCOIN / LIGHTNING (via agent wallet)</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <Tile icon="ti-cash" color="var(--gold)" label="Cash → Lightning"
              sub="Give cash, receive sats to their wallet" onClick={() => openTx({ t: "g_cash_ln" })} />
            <Tile icon="ti-device-mobile" color="var(--emerald-deep)" label="M-Pesa → Lightning"
              sub="Send M-Pesa, receive sats" onClick={() => openTx({ t: "g_mpesa_ln" })} />
            <Tile icon="ti-currency-bitcoin" color="#F7931A" label="Lightning → Cash"
              sub="Pay Lightning invoice, receive cash" onClick={() => openTx({ t: "g_ln_cash" })} warn={criticalFloat} />
            <Tile icon="ti-currency-bitcoin" color="#F7931A" label="Lightning → M-Pesa"
              sub="Pay Lightning invoice, receive M-Pesa" onClick={() => openTx({ t: "g_ln_mpesa" })} />
          </div>

          <div style={{ borderTop: "1px solid var(--border-soft)", paddingTop: 14 }}>
            <p className="note">No account yet?</p>
            <a href="/register" style={{ color: "var(--gold)", fontSize: 13, fontWeight: 600 }}>
              <i className="ti ti-arrow-right" /> Help them open a YeboBank account →
            </a>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MEMBER — lookup screen (before verification)
          ══════════════════════════════════════════════════════════════════════ */}
      {mode === "member" && !member && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="section-head" style={{ marginBottom: 14 }}>
            <h2>Member lookup</h2>
            <button onClick={() => setMode(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--soft)", fontSize: 13 }}>
              ← Back
            </button>
          </div>
          <p className="note" style={{ marginBottom: 12 }}>
            Enter the customer&apos;s phone number to find their YeboBank account.
            Deposits don&apos;t require verification — only withdrawals and services do.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input className="input" placeholder="Phone (+254712... or 0712...)"
              value={phone} onChange={(e) => { setPhone(e.target.value); setLookErr(""); }} />
            {phone && phoneErr(phone) && <ErrNote msg={phoneErr(phone)!} />}
            {lookErr && <ErrNote msg={lookErr} />}
          </div>
          <div className="modal-actions" style={{ marginTop: 14 }}>
            <Button disabled={!phone || !!phoneErr(phone) || looking} onClick={doLookup}>
              {looking ? "Looking up…" : "Find account"}
            </Button>
            <Button variant="ghost" onClick={() => { setMode("guest"); setPhone(""); setLookErr(""); }}>
              Serve as guest instead
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MEMBER DASHBOARD (after lookup)
          ══════════════════════════════════════════════════════════════════════ */}
      {mode === "member" && member && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="section-head" style={{ marginBottom: 4 }}>
            <div>
              <h2>{member.name ?? "Member"}</h2>
              <p className="note">
                {member.phone}
                {member.verified
                  ? <span style={{ color: "var(--emerald-deep)", marginLeft: 8 }}><i className="ti ti-shield-check" /> Verified</span>
                  : <span style={{ color: "var(--soft)", marginLeft: 8 }}><i className="ti ti-shield" /> Not yet verified</span>}
              </p>
            </div>
            <button onClick={() => { resetMember(); setMode(null); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--soft)", fontSize: 13 }}>
              New customer
            </button>
          </div>

          <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, margin: "16px 0 8px", color: "var(--soft)" }}>
            ADD MONEY TO WALLET <span style={{ fontSize: 11, fontWeight: 400 }}>(no verification required)</span>
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
            <Tile icon="ti-cash" color="var(--gold)" label="Cash" sub="Agent receives cash" onClick={() => openTx({ t: "m_dep_cash" })} />
            <Tile icon="ti-device-mobile" color="var(--emerald-deep)" label="M-Pesa" sub="Agent receives M-Pesa" onClick={() => openTx({ t: "m_dep_mpesa" })} />
            <Tile icon="ti-currency-bitcoin" color="#F7931A" label="Lightning" sub="Customer pays invoice" onClick={() => openTx({ t: "m_dep_ln" })} />
          </div>

          <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, margin: "0 0 8px", color: "var(--soft)" }}>
            WITHDRAW FROM WALLET <span style={{ fontSize: 11, fontWeight: 400 }}>(verification required)</span>
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
            <Tile icon="ti-cash" color="var(--gold)" label="Cash" sub="Agent gives cash"
              onClick={() => openTx({ t: "m_wdraw_cash" })} warn={criticalFloat} />
            <Tile icon="ti-device-mobile" color="var(--emerald-deep)" label="M-Pesa" sub="Agent sends M-Pesa"
              onClick={() => openTx({ t: "m_wdraw_mpesa" })} />
            <Tile icon="ti-currency-bitcoin" color="#F7931A" label="Lightning" sub="Pay their invoice"
              onClick={() => openTx({ t: "m_wdraw_ln" })} />
          </div>

          <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, margin: "0 0 8px", color: "var(--soft)" }}>
            YEBOBANK SERVICES <span style={{ fontSize: 11, fontWeight: 400 }}>(verification required)</span>
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            <Tile icon="ti-lock" color="var(--forest)" label="Savings deposit" sub="Add to a locked savings goal"
              onClick={() => openTx({ t: "m_svc", kind: "savings_deposit" })} />
            <Tile icon="ti-users" color="var(--forest)" label="Chama contribution" sub="Pay into a chama pool"
              onClick={() => openTx({ t: "m_svc", kind: "chama_contribution" })} />
            <Tile icon="ti-file-invoice" color="var(--soft)" label="Withdrawal request" sub="File a request for Mlinzi"
              onClick={() => openTx({ t: "m_svc", kind: "withdrawal_request" })} />
            <Tile icon="ti-bolt" color="#F7931A" label="Lightning send" sub="Send sats for the customer"
              onClick={() => openTx({ t: "m_svc", kind: "lightning_send" })} />
          </div>

          <div style={{ borderTop: "1px solid var(--border-soft)", paddingTop: 12 }}>
            <p className="note" style={{ marginBottom: 6 }}>Customer doesn&apos;t have their phone today?</p>
            <button onClick={() => { resetMember(); setMode("guest"); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gold)", fontSize: 13, fontWeight: 600 }}>
              <i className="ti ti-arrow-right" /> Serve as guest using agent wallet
            </button>
          </div>
        </div>
      )}

      {/* ── Recent activity ──────────────────────────────────────────────────── */}
      <div className="card" style={{ marginTop: 10 }}>
        <div className="section-head"><h2>Recent activity</h2></div>
        {history.length === 0 && <p className="note">No transactions yet today.</p>}
        {history.slice(0, 8).map((tx) => <TransactionRow key={tx.id} tx={tx} />)}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          TRANSACTION MODAL
         ════════════════════════════════════════════════════════════════════════ */}
      {tx && (
        <div className="modal-overlay" onClick={closeTx}>
          <div className="modal" style={{ maxHeight: "90dvh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeTx}>&times;</button>

            {/* ── VERIFICATION GATE (for withdrawals/services if not yet verified) ── */}
            {needsVerify && member && (
              <>
                <h2>Verify identity</h2>
                <VerifyStep member={member} channel={channel} codeSent={codeSent} code={code}
                  error={txErr} verifying={verifying}
                  onSendCode={sendCode} onCodeChange={(v) => { setCode(v); setTxErr(""); }}
                  onVerify={doVerify} onCancel={closeTx} />
              </>
            )}

            {/* ── POST-DEPOSIT FORWARD ─────────────────────────────────────── */}
            {!needsVerify && tx.t === "post_dep" && member && (
              <>
                <h2><i className="ti ti-circle-check" style={{ color: "var(--emerald-deep)", marginRight: 8 }} />Deposit complete</h2>
                <GoodNote msg={`${num(tx.sats)} sats added to ${member.name ?? member.phone}'s wallet.`} />
                <p className="modal-sub" style={{ marginTop: 12 }}>What would they like to do next?</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                  {[
                    { icon: "ti-wallet", label: "Keep in wallet", sub: "Done — sats stay in their account", action: () => { closeTx(); load(); } },
                    { icon: "ti-bolt", label: "Send via Lightning", sub: "Immediately send sats to another wallet", action: () => openTx({ t: "m_wdraw_ln" }) },
                    { icon: "ti-lock", label: "Deposit to savings", sub: "Move into a locked savings goal", action: () => openTx({ t: "m_svc", kind: "savings_deposit" }) },
                    { icon: "ti-users", label: "Contribute to chama", sub: "Pay into a group savings pool", action: () => openTx({ t: "m_svc", kind: "chama_contribution" }) },
                  ].map((o) => (
                    <button key={o.label} onClick={o.action} style={{
                      textAlign: "left", padding: 12, cursor: "pointer", background: "var(--ivory)",
                      border: "1.5px solid var(--border)", borderRadius: "var(--r-sm)",
                    }}>
                      <strong><i className={`ti ${o.icon}`} style={{ marginRight: 8 }} />{o.label}</strong>
                      <p className="note" style={{ marginTop: 3 }}>{o.sub}</p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* ── FLOAT TOP-UP ─────────────────────────────────────────────── */}
            {!needsVerify && tx.t === "topup" && (
              <>
                <h2><i className="ti ti-bolt" style={{ color: "#F7931A", marginRight: 8 }} />Top up sats float</h2>
                <p className="modal-sub">Generate a Lightning invoice and pay it from your personal wallet to replenish your agent float.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <input className="input" type="number" min="1" placeholder="Amount (sats)"
                      value={rawAmount} onChange={(e) => { setRawAmount(e.target.value); setTopupInv(null); setTxErr(""); }} />
                    {rawAmount && Number(rawAmount) > 0 && (
                      <p className="note" style={{ marginTop: 5 }}>≈ KES {num(Math.round(Number(rawAmount) * rate.kesPerSat))}</p>
                    )}
                  </div>
                  {topupInv
                    ? <InvoiceQR invoice={topupInv} amountSats={Number(rawAmount)} />
                    : <Button variant="ghost" disabled={!rawAmount || Number(rawAmount) <= 0 || topupBusy} onClick={genTopup}>
                        <i className="ti ti-qrcode" /> {topupBusy ? "Generating…" : "Generate invoice"}
                      </Button>}
                  {txErr && <ErrNote msg={txErr} />}
                </div>
                <div className="modal-actions">
                  <Button disabled={!topupInv || submitting} onClick={confirmTopup}>
                    {submitting ? "Confirming…" : "Confirm — I've paid the invoice"}
                  </Button>
                  <Button variant="ghost" onClick={closeTx}>Cancel</Button>
                </div>
              </>
            )}

            {/* ── TRANSACTION FORMS ────────────────────────────────────────── */}
            {!needsVerify && tx.t !== "post_dep" && tx.t !== "topup" && (
              <>
                {/* Dynamic title */}
                <h2>{txTitle(tx, member)}</h2>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                  {/* ── M-Pesa incoming: show agent till ── */}
                  {(tx.t === "g_mpesa_cash" || tx.t === "g_mpesa_ln" || tx.t === "m_dep_mpesa") && (
                    <GoodNote msg={`Ask the customer to send M-Pesa to your till: ${agent.mpesaTillNumber}`} />
                  )}

                  {/* ── Unit toggle (for Sats corridors that allow KES) ── */}
                  {(tx.t === "g_cash_ln" || tx.t === "g_mpesa_ln" || tx.t === "m_dep_cash" ||
                    tx.t === "m_wdraw_cash" || tx.t === "m_wdraw_mpesa" || tx.t === "m_wdraw_ln" ||
                    (tx.t === "m_svc" && tx.kind !== "lightning_send")) && (
                    <UnitToggle useKes={useKes} onToggle={(b) => { setUseKes(b); setRawAmount(""); setTxErr(""); }} />
                  )}

                  {/* ── Amount ── */}
                  {tx.t !== "g_ln_cash" && tx.t !== "g_ln_mpesa" && tx.t !== "m_dep_ln" && (
                    <div>
                      <input className="input" type="number" min="0"
                        placeholder={
                          tx.t === "g_cash_mpesa" || tx.t === "g_mpesa_cash" || tx.t === "m_dep_mpesa" ? "Amount (KES)"
                          : useKes ? "Amount (KES)" : "Amount (sats)"
                        }
                        value={rawAmount}
                        onChange={(e) => { setRawAmount(e.target.value); setLnInvoice(null); setTxErr(""); }} />
                      {rawAmount && Number(rawAmount) > 0 && <p className="note" style={{ marginTop: 5 }}>{preview()}</p>}
                    </div>
                  )}

                  {/* ── Lightning → Cash/M-Pesa: enter sats, then generate QR ── */}
                  {(tx.t === "g_ln_cash" || tx.t === "g_ln_mpesa" || tx.t === "m_dep_ln") && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <input className="input" type="number" min="1" placeholder="Amount (sats)"
                          value={rawAmount}
                          onChange={(e) => { setRawAmount(e.target.value); setLnInvoice(null); setTxErr(""); }} />
                        {rawAmount && Number(rawAmount) > 0 && (
                          <p className="note" style={{ marginTop: 5 }}>≈ KES {num(Math.round(Number(rawAmount) * rate.kesPerSat))}</p>
                        )}
                      </div>
                      {lnInvoice
                        ? <InvoiceQR invoice={lnInvoice} amountSats={Number(rawAmount)} />
                        : <Button variant="ghost" disabled={!rawAmount || Number(rawAmount) <= 0 || lnBusy} onClick={genInvoice}>
                            <i className="ti ti-qrcode" /> {lnBusy ? "Generating…" : "Generate QR for customer"}
                          </Button>}
                    </div>
                  )}

                  {/* ── Outgoing M-Pesa destination ── */}
                  {(tx.t === "g_cash_mpesa" || tx.t === "g_ln_mpesa" || tx.t === "m_wdraw_mpesa") && (
                    <div>
                      <input className="input" placeholder="Destination M-Pesa number (+254... or 07...)"
                        value={mpesaDest} onChange={(e) => { setMpesaDest(e.target.value); setTxErr(""); }} />
                      <p className="note" style={{ marginTop: 4 }}>You will send M-Pesa to this number after confirming.</p>
                    </div>
                  )}

                  {/* ── Incoming M-Pesa: reference code field ── */}
                  {(tx.t === "g_mpesa_cash" || tx.t === "g_mpesa_ln" || tx.t === "m_dep_mpesa") && (
                    <input className="input" placeholder="M-Pesa reference code (optional, e.g. QHJ89NKPXY)"
                      value={mpesaRef} onChange={(e) => setMpesaRef(e.target.value)} />
                  )}

                  {/* ── Lightning destination (paste/scan) ── */}
                  {(tx.t === "g_cash_ln" || tx.t === "g_mpesa_ln" || tx.t === "m_wdraw_ln" ||
                    (tx.t === "m_svc" && tx.kind === "lightning_send")) && (
                    <ScanRow value={lnDest} onChange={(v) => { setLnDest(v); setTxErr(""); }}
                      onScan={() => setScanning(true)}
                      placeholder="Customer's Lightning invoice or address" />
                  )}

                  {/* ── Cash → Sats (Cash→Ln guest): destination address ── */}
                  {tx.t === "g_cash_ln" && (
                    <p className="note"><i className="ti ti-info-circle" /> Agent sends from their own Lightning wallet to the customer&apos;s address.</p>
                  )}

                  {/* ── Low float warning ── */}
                  {tx.t === "m_wdraw_cash" && lowFloat && (
                    <ErrNote msg={`Sats float is low (${num(agent.floatLimitSats)} sats). Ensure you have enough cash on hand.`} />
                  )}

                  {/* ── M-Pesa receipt confirm checkbox ── */}
                  {(tx.t === "g_mpesa_cash" || tx.t === "g_mpesa_ln" || tx.t === "m_dep_mpesa") && (
                    <button onClick={() => setReceiptOk((v) => !v)} style={{
                      textAlign: "left", padding: "10px 14px", cursor: "pointer",
                      background: receiptOk ? "rgba(17,166,91,.08)" : "var(--ivory)",
                      border: `1.5px solid ${receiptOk ? "var(--emerald-deep)" : "var(--border)"}`,
                      borderRadius: "var(--r-sm)",
                    }}>
                      <i className={`ti ${receiptOk ? "ti-checkbox" : "ti-square"}`}
                        style={{ marginRight: 8, color: receiptOk ? "var(--emerald-deep)" : "var(--soft)" }} />
                      <strong>I have received the M-Pesa</strong>
                      <p className="note" style={{ marginTop: 3 }}>Only confirm after you see the credit in your M-Pesa app.</p>
                    </button>
                  )}

                  {/* ── Service kind label (m_svc) ── */}
                  {tx.t === "m_svc" && (
                    <p className="note" style={{ color: "var(--emerald-deep)", fontWeight: 500 }}>
                      <i className="ti ti-bookmark" style={{ marginRight: 6 }} />
                      {tx.kind === "savings_deposit" ? "Savings deposit"
                       : tx.kind === "chama_contribution" ? "Chama contribution"
                       : tx.kind === "withdrawal_request" ? "Withdrawal request"
                       : "Lightning send"}
                    </p>
                  )}

                  {txErr && <ErrNote msg={txErr} />}
                </div>

                <div className="modal-actions">
                  {/* Lightning receive: wait for invoice before confirm */}
                  {(tx.t === "g_ln_cash" || tx.t === "g_ln_mpesa" || tx.t === "m_dep_ln") ? (
                    <Button disabled={!lnInvoice || submitting} onClick={handleSubmit}>
                      {submitting ? "Confirming…"
                        : tx.t === "g_ln_mpesa" ? "Confirm received — send M-Pesa"
                        : tx.t === "m_dep_ln" ? "Confirm received — credit wallet"
                        : "Confirm received — give cash"}
                    </Button>
                  ) : (
                    <Button disabled={submitting} onClick={handleSubmit}>
                      {submitting ? "Processing…" : txConfirmLabel(tx)}
                    </Button>
                  )}
                  <Button variant="ghost" onClick={closeTx}>Cancel</Button>
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

// ─────────────────────────────────────────────────────────────────────────────
// Label helpers (keep them out of the render body)
// ─────────────────────────────────────────────────────────────────────────────
function txTitle(tx: Tx, member: MemberCtx | null): string {
  const m = member?.name ?? "member";
  switch (tx.t) {
    case "g_cash_mpesa":   return "Cash → M-Pesa";
    case "g_mpesa_cash":   return "M-Pesa → Cash";
    case "g_cash_ln":      return "Cash → Lightning";
    case "g_mpesa_ln":     return "M-Pesa → Lightning";
    case "g_ln_cash":      return "Lightning → Cash";
    case "g_ln_mpesa":     return "Lightning → M-Pesa";
    case "m_dep_cash":     return `Cash deposit — ${m}`;
    case "m_dep_mpesa":    return `M-Pesa deposit — ${m}`;
    case "m_dep_ln":       return `Lightning deposit — ${m}`;
    case "m_wdraw_cash":   return `Withdraw to cash — ${m}`;
    case "m_wdraw_mpesa":  return `Withdraw to M-Pesa — ${m}`;
    case "m_wdraw_ln":     return `Withdraw via Lightning — ${m}`;
    case "m_svc":
      return tx.kind === "savings_deposit"    ? `Savings deposit — ${m}`
           : tx.kind === "chama_contribution" ? `Chama contribution — ${m}`
           : tx.kind === "withdrawal_request" ? `Withdrawal request — ${m}`
           : `Lightning send — ${m}`;
    default: return "Transaction";
  }
}

function txConfirmLabel(tx: Tx): string {
  switch (tx.t) {
    case "g_cash_mpesa":   return "Confirm — send M-Pesa";
    case "g_mpesa_cash":   return "Confirm — give cash";
    case "g_cash_ln":      return "Confirm — send Lightning";
    case "g_mpesa_ln":     return "Confirm — send Lightning";
    case "m_dep_cash":     return "Confirm — credit wallet";
    case "m_dep_mpesa":    return "Confirm — credit wallet";
    case "m_wdraw_cash":   return "Confirm — give cash";
    case "m_wdraw_mpesa":  return "Confirm — send M-Pesa";
    case "m_wdraw_ln":     return "Confirm — pay Lightning";
    case "m_svc":
      if (tx.t === "m_svc") return tx.kind === "lightning_send" ? "Confirm — send Lightning" : "Confirm & record";
      return "Confirm";
    default: return "Confirm";
  }
}
