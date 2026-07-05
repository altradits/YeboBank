"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRoleGate } from "@/lib/useRoleGate";
import Button from "@/components/ui/Button";
import QRScanner from "@/components/ui/QRScanner";
import TransactionRow from "@/components/app/TransactionRow";
import { ATMCard } from "@/components/app/ATMCard";
import { useRate } from "@/lib/rate-context";
import { num, fmtKESraw } from "@/lib/format";
import {
  getUser, getAgent, getAgentHistory,
  agentCashTransact, agentFiatSwap, agentTopUpFloat, confirmAgentTopUp,
  lookupAgentCustomer, requestAgentAccessCode, verifyAgentAccessCode, agentAssistService,
  agentGenerateInvoice, agentPayInvoice,
  requestReserveRelease, claimReserve, moveToReserve,
  triggerPanic, submitReactivationCode, saveEmergencyContacts,
} from "@/lib/api";
import type { AccessChannel, AgentServiceKind } from "@/lib/api";
import type { Agent, LedgerEntry, EmergencyContact, ContactTier, PanicLevel } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const LOW_FLOAT      = 500_000;
const CRITICAL_FLOAT = 150_000;
const KE_PHONE_RE    = /^(\+254|0)\d{9}$/;

type Mode = null | "guest" | "member";
interface MemberCtx { phone: string; name: string | null; verified: boolean }

type Tx =
  | { t: "g_cash_mpesa" } | { t: "g_mpesa_cash" } | { t: "g_cash_ln" }
  | { t: "g_mpesa_ln" }   | { t: "g_ln_cash" }    | { t: "g_ln_mpesa" }
  | { t: "m_dep_cash" }   | { t: "m_dep_mpesa" }  | { t: "m_dep_ln" }
  | { t: "m_wdraw_cash" } | { t: "m_wdraw_mpesa" }| { t: "m_wdraw_ln" }
  | { t: "m_svc"; kind: AgentServiceKind }
  | { t: "topup" }
  | { t: "post_dep"; sats: number }
  | { t: "reserve_release" }
  | { t: "move_to_reserve" };

const CHANNELS: { id: AccessChannel; label: string; icon: string; hint: string }[] = [
  { id: "sms",     label: "SMS code",   icon: "ti-message", hint: "One-time code sent to their phone." },
  { id: "email",   label: "Email code", icon: "ti-mail",    hint: "One-time code sent to their email." },
  { id: "offline", label: "Saved code", icon: "ti-key",     hint: "A code the customer memorized." },
];

const TIER_META: Record<ContactTier, { label: string; tapCount: number; color: string; icon: string; desc: string }> = {
  personal:   { label: "Personal",       tapCount: 2, color: "#E6A817", icon: "ti-user-heart",  desc: "Closest trusted person — alerted by 2 taps on Confirm" },
  legal:      { label: "Legal / Police", tapCount: 3, color: "#D06000", icon: "ti-shield-lock", desc: "Law enforcement — alerted by 3 taps" },
  life_death: { label: "Life & Death",   tapCount: 4, color: "#C23B22", icon: "ti-urgent",      desc: "Emergency response — ALL must confirm after 4 taps" },
};

// ─────────────────────────────────────────────────────────────────────────────
// UI helpers
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

function UnitToggle({ useKes, onToggle }: { useKes: boolean; onToggle: (b: boolean) => void }) {
  return (
    <div style={{ display: "flex", borderRadius: "var(--r-sm)", border: "1px solid var(--border)", overflow: "hidden" }}>
      {[{ id: true, label: "KES" }, { id: false, label: "Sats" }].map(({ id, label }) => (
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

function InvoiceQR({ invoice, amountSats }: { invoice: string; amountSats: number }) {
  const [copied, setCopied] = useState(false);
  function copy() { navigator.clipboard.writeText(invoice); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  return (
    <div style={{ textAlign: "center", background: "var(--ivory)", borderRadius: "var(--r-sm)", padding: 16 }}>
      <i className="ti ti-qrcode" style={{ fontSize: 56, color: "var(--forest)" }} />
      <p className="note" style={{ marginTop: 8, wordBreak: "break-all", fontFamily: "var(--font-mono)", fontSize: 10 }}>{invoice}</p>
      <p className="note" style={{ marginTop: 6 }}>Customer pays <strong>{num(amountSats)} sats</strong> from their Lightning wallet.</p>
      <button onClick={copy} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--soft)", fontSize: 12, marginTop: 4 }}>
        <i className="ti ti-copy" /> {copied ? "Copied!" : "Copy invoice"}
      </button>
    </div>
  );
}

// ── Tap-count aware confirm button ────────────────────────────────────────────
// 1 tap = normal (Level 0) · 2 taps = personal alert · 3 = police · 4+ = life & death
// The 900ms debounce shows a natural "Confirming…" to anyone watching.
function ConfirmButton({ label, disabled, onConfirm }: {
  label: string; disabled?: boolean; onConfirm: (level: 0 | 1 | 2 | 3) => void;
}) {
  const tapRef   = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [busy, setBusy] = useState(false);

  function tap() {
    if (disabled || busy) return;
    tapRef.current += 1;
    setBusy(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const n = tapRef.current;
      tapRef.current = 0;
      setBusy(false);
      onConfirm(Math.min(n - 1, 3) as 0 | 1 | 2 | 3);
    }, 900);
  }

  return <Button disabled={disabled} onClick={tap}>{busy ? "Confirming…" : label}</Button>;
}

// ── Member identity verification step ─────────────────────────────────────────
function VerifyStep({ member, channel, codeSent, code, error, verifying, onSendCode, onCodeChange, onVerify, onCancel }: {
  member: MemberCtx; channel: AccessChannel | null; codeSent: boolean; code: string;
  error: string; verifying: boolean;
  onSendCode: (ch: AccessChannel) => void; onCodeChange: (v: string) => void;
  onVerify: () => void; onCancel: () => void;
}) {
  return (
    <>
      <p className="modal-sub">
        <strong>{member.name ?? member.phone}</strong> — confirm they&apos;re physically present before touching their wallet.
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
            placeholder={channel === "offline" ? "Code the customer reads out" : "One-time code"}
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
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function AgentPage() {
  const rate    = useRate();
  const router  = useRouter();
  const allowed = useRoleGate((u) => u.isAgent);

  const [agent,   setAgent]   = useState<Agent | null>(null);
  const [history, setHistory] = useState<LedgerEntry[]>([]);
  function load() { getAgent().then(setAgent); getAgentHistory().then(setHistory); }
  useEffect(load, []);

  // Reserve countdown
  const [reserveSecsLeft, setReserveSecsLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!agent?.reserveUnlockAt) { setReserveSecsLeft(null); return; }
    function tick() {
      const secs = Math.ceil((new Date(agent!.reserveUnlockAt!).getTime() - Date.now()) / 1000);
      setReserveSecsLeft(secs > 0 ? secs : 0);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [agent?.reserveUnlockAt]);

  // Customer context
  const [mode,    setMode]    = useState<Mode>(null);
  const [member,  setMember]  = useState<MemberCtx | null>(null);
  const [phone,   setPhone]   = useState("");
  const [looking, setLooking] = useState(false);
  const [lookErr, setLookErr] = useState("");

  // Member verification
  const [channel,   setChannel]   = useState<AccessChannel | null>(null);
  const [codeSent,  setCodeSent]  = useState(false);
  const [code,      setCode]      = useState("");
  const [verifying, setVerifying] = useState(false);

  // Active transaction
  const [tx, setTx] = useState<Tx | null>(null);

  // Form fields
  const [rawAmount,  setRawAmount]  = useState("");
  const [useKes,     setUseKes]     = useState(true);
  const [mpesaDest,  setMpesaDest]  = useState("");
  const [mpesaRef,   setMpesaRef]   = useState("");
  const [lnInvoice,  setLnInvoice]  = useState<string | null>(null);
  const [lnBusy,     setLnBusy]     = useState(false);
  const [lnDest,     setLnDest]     = useState("");
  const [scanning,   setScanning]   = useState(false);
  const [receiptOk,  setReceiptOk]  = useState(false);
  const [topupInv,   setTopupInv]   = useState<string | null>(null);
  const [topupBusy,  setTopupBusy]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [txErr,      setTxErr]      = useState("");
  const [needsVerify, setNeedsVerify] = useState(false);

  // Security / panic
  const [panicExecuting, setPanicExecuting] = useState(false);
  const [reactivation,   setReactivation]   = useState<Record<string, string>>({});
  const [reactivErr,     setReactivErr]     = useState<Record<string, string>>({});
  const [reactivOk,      setReactivOk]      = useState<Record<string, boolean>>({});
  const [reservePin,     setReservePin]     = useState("");
  const [reservePinErr,  setReservePinErr]  = useState("");
  const [moveAmount,     setMoveAmount]     = useState("");
  const [showSecurity,   setShowSecurity]   = useState(false);
  const [draftContacts,  setDraftContacts]  = useState<EmergencyContact[] | null>(null);
  const [savingContacts, setSavingContacts] = useState(false);

  // ── helpers ──
  function toSats(val: string): number {
    const n = Number(val) || 0;
    return useKes ? Math.round(n / rate.kesPerSat) : Math.round(n);
  }
  function preview(): string {
    if (!rawAmount || Number(rawAmount) <= 0 || !agent) return "";
    if (useKes) {
      return `≈ ${num(toSats(rawAmount))} sats · commission ≈ ${fmtKESraw(Number(rawAmount) * agent.commissionRate, 0)}`;
    }
    return `≈ KES ${num(Math.round(Number(rawAmount) * rate.kesPerSat))} · commission ≈ ${num(Math.round(Number(rawAmount) * agent.commissionRate))} sats`;
  }
  function phoneErr(p: string): string | null {
    return !p ? null : KE_PHONE_RE.test(p.trim()) ? null : "Use +254712345678 or 0712345678.";
  }
  function fmtCountdown(secs: number): string {
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  }

  function resetTxFields() {
    setRawAmount(""); setUseKes(true);
    setMpesaDest(""); setMpesaRef(""); setReceiptOk(false);
    setLnInvoice(null); setLnBusy(false); setLnDest(""); setScanning(false);
    setTopupInv(null); setTopupBusy(false);
    setSubmitting(false); setTxErr("");
    setNeedsVerify(false); setChannel(null); setCodeSent(false); setCode(""); setVerifying(false);
    setReservePin(""); setReservePinErr(""); setMoveAmount("");
  }

  function openTx(t: Tx) {
    resetTxFields();
    const needsV = !member?.verified && (
      t.t === "m_wdraw_cash" || t.t === "m_wdraw_mpesa" || t.t === "m_wdraw_ln" || t.t === "m_svc"
    );
    setNeedsVerify(needsV);
    if (t.t === "g_ln_cash" || t.t === "g_ln_mpesa" || t.t === "m_dep_ln" || t.t === "m_wdraw_ln") setUseKes(false);
    setTx(t);
  }
  function closeTx() { setTx(null); setTxErr(""); }

  function resetMember() {
    setMember(null); setPhone(""); setLookErr(""); setLooking(false);
    setChannel(null); setCodeSent(false); setCode(""); setVerifying(false);
  }

  // Member lookup
  async function doLookup() {
    const pe = phoneErr(phone);
    if (pe) { setLookErr(pe); return; }
    setLooking(true); setLookErr("");
    const c = await lookupAgentCustomer(phone.trim());
    setLooking(false);
    if (c.isMember) {
      setMember({ phone: c.phone, name: c.name, verified: false });
    } else {
      setLookErr("No YeboBank account found. Serve as guest or help them register at yebobank.com.");
    }
  }

  // Member verification
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
    if (r.verified) { setMember({ ...member, verified: true }); setNeedsVerify(false); }
    else setTxErr("Code didn't match — check with the customer.");
  }

  // Panic
  async function executePanic(level: 1 | 2 | 3) {
    setPanicExecuting(true);
    if (level < 3) await new Promise(r => setTimeout(r, 2200));
    try {
      const result = await triggerPanic(level);
      setAgent(prev => prev ? {
        ...prev, panicLevel: level,
        panicLockedAt: new Date().toISOString(),
        contactsRequired: result.contactsRequired,
        contactsConfirmed: [],
      } : prev);
    } catch {
      setAgent(prev => prev ? { ...prev, panicLevel: level, panicLockedAt: new Date().toISOString() } : prev);
    }
    setPanicExecuting(false);
    closeTx();
  }

  async function handleConfirmWithLevel(level: 0 | 1 | 2 | 3) {
    if (level === 0) await handleSubmit();
    else await executePanic(level as 1 | 2 | 3);
  }

  // Reactivation codes
  async function submitCode(contactId: string) {
    const c = reactivation[contactId]?.trim();
    if (!c) { setReactivErr(e => ({ ...e, [contactId]: "Enter the code." })); return; }
    setReactivErr(e => ({ ...e, [contactId]: "" }));
    const r = await submitReactivationCode(contactId, c);
    if (r.accepted) {
      setReactivOk(o => ({ ...o, [contactId]: true }));
      setAgent(r.agent);
      if (r.allConfirmed) { setReactivation({}); setReactivOk({}); setReactivErr({}); }
    } else {
      setReactivErr(e => ({ ...e, [contactId]: "Incorrect code — try again." }));
    }
  }

  // Reserve
  async function handleReserveRelease() {
    setReservePinErr(""); setSubmitting(true);
    const r = await requestReserveRelease(reservePin);
    setSubmitting(false);
    if (!r.ok) { setReservePinErr("Incorrect PIN."); return; }
    setAgent(prev => prev ? { ...prev, reserveUnlockAt: r.unlocksAt! } : prev);
    closeTx();
  }
  async function handleClaimReserve() {
    setSubmitting(true);
    const updated = await claimReserve();
    setAgent(updated); setSubmitting(false); closeTx();
  }
  async function handleMoveToReserve() {
    const n = Number(moveAmount);
    if (!n || n <= 0) { setTxErr("Enter an amount."); return; }
    setSubmitting(true);
    const updated = await moveToReserve(Math.round(n));
    setAgent(updated); setSubmitting(false); closeTx(); load();
  }

  // Main submit
  async function handleSubmit() {
    if (!tx || !agent) return;
    const n = Number(rawAmount);
    if (!rawAmount || n <= 0) { setTxErr("Enter an amount greater than zero."); return; }
    const sats = toSats(rawAmount);
    const kes  = useKes ? n : Math.round(n * rate.kesPerSat);

    if ((tx.t === "g_cash_mpesa" || tx.t === "g_ln_mpesa" || tx.t === "m_wdraw_mpesa") && !mpesaDest.trim()) {
      setTxErr("Enter the destination M-Pesa number."); return;
    }
    if (mpesaDest && !KE_PHONE_RE.test(mpesaDest.trim())) {
      setTxErr("M-Pesa number format looks wrong."); return;
    }
    if ((tx.t === "g_cash_ln" || tx.t === "g_mpesa_ln" || tx.t === "m_wdraw_ln" ||
         (tx.t === "m_svc" && tx.kind === "lightning_send")) && !lnDest.trim()) {
      setTxErr("Paste or scan the Lightning invoice / address."); return;
    }
    if ((tx.t === "g_mpesa_cash" || tx.t === "g_mpesa_ln" || tx.t === "m_dep_mpesa") && !receiptOk) {
      setTxErr("Confirm you have received the M-Pesa before proceeding."); return;
    }
    if ((tx.t === "g_ln_cash" || tx.t === "g_ln_mpesa" || tx.t === "m_dep_ln") && !lnInvoice) {
      setTxErr("Generate the invoice QR first, wait for the customer to pay."); return;
    }
    if (tx.t === "m_wdraw_cash" && sats > agent.workingFloatSats) {
      setTxErr(`Exceeds working float (${num(agent.workingFloatSats)} sats). Release reserve first if needed.`); return;
    }

    setTxErr(""); setSubmitting(true);
    try {
      switch (tx.t) {
        case "g_cash_mpesa":  await agentFiatSwap("cash",  "mpesa", kes, mpesaDest); break;
        case "g_mpesa_cash":  await agentFiatSwap("mpesa", "cash",  kes, mpesaRef || undefined); break;
        case "g_cash_ln":     await agentPayInvoice(lnDest, sats); break;
        case "g_mpesa_ln":    await agentPayInvoice(lnDest, sats); break;
        case "g_ln_cash":     await agentCashTransact("in", "guest", sats); break;
        case "g_ln_mpesa":    await agentCashTransact("in", "guest", sats); break;
        case "m_dep_cash":
          await agentCashTransact("in", member!.phone, sats);
          setTx({ t: "post_dep", sats }); setSubmitting(false); return;
        case "m_dep_mpesa":
          await agentCashTransact("in", member!.phone, Math.round(kes / rate.kesPerSat));
          setTx({ t: "post_dep", sats: Math.round(kes / rate.kesPerSat) }); setSubmitting(false); return;
        case "m_dep_ln":
          await agentCashTransact("in", member!.phone, sats);
          setTx({ t: "post_dep", sats }); setSubmitting(false); return;
        case "m_wdraw_cash":  await agentCashTransact("out", member!.phone, sats); break;
        case "m_wdraw_mpesa": await agentCashTransact("out", member!.phone, sats); break;
        case "m_wdraw_ln":
          await agentCashTransact("out", member!.phone, sats);
          await agentPayInvoice(lnDest, sats); break;
        case "m_svc":
          if (tx.kind === "lightning_send") await agentPayInvoice(lnDest, sats);
          await agentAssistService(member!.phone, tx.kind, sats); break;
        default: break;
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
    setAgent(updated); setSubmitting(false); closeTx(); load();
  }

  // Contacts editing
  function startEditContacts() { setDraftContacts(agent ? [...agent.emergencyContacts] : []); }
  async function saveContacts() {
    if (!draftContacts) return;
    setSavingContacts(true);
    const updated = await saveEmergencyContacts(draftContacts);
    setAgent(updated); setSavingContacts(false); setDraftContacts(null);
  }
  function addContact(tier: ContactTier) {
    setDraftContacts(cs => [...(cs ?? []), { id: `ec_${Date.now()}`, name: "", phone: "", tier, priority: (cs?.length ?? 0) + 1 }]);
  }
  function removeContact(id: string) { setDraftContacts(cs => (cs ?? []).filter(c => c.id !== id)); }
  function updateContact(id: string, field: keyof EmergencyContact, value: string | number) {
    setDraftContacts(cs => (cs ?? []).map(c => c.id === id ? { ...c, [field]: value } : c));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  if (!allowed) return null;
  if (!agent) return <p className="note">Loading…</p>;

  const criticalWorking = agent.workingFloatSats < CRITICAL_FLOAT;
  const lowWorking      = agent.workingFloatSats < LOW_FLOAT;
  const reserveReady    = !!agent.reserveUnlockAt && (reserveSecsLeft ?? 1) === 0;
  const reservePending  = !!agent.reserveUnlockAt && (reserveSecsLeft ?? 0) > 0;
  const panicked        = agent.panicLevel > 0;

  function Tile({ icon, color, label, sub, onClick, warn }: {
    icon: string; color: string; label: string; sub?: string; onClick: () => void; warn?: boolean;
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

  // ── Panic overlay ─────────────────────────────────────────────────────────
  const PANIC_META: Record<1 | 2 | 3, { icon: string; title: string; subtitle: string; accentColor: string }> = {
    1: { icon: "ti-lock",       accentColor: "#E6A817", title: "Transaction Authorization Required",
         subtitle: "The system requires verification from your emergency contact before this transaction can proceed." },
    2: { icon: "ti-shield-lock", accentColor: "#D06000", title: "Legal Verification Required",
         subtitle: "This transaction has triggered a compliance check. The responding officer will provide a verification code." },
    3: { icon: "ti-urgent",     accentColor: "#C23B22", title: "EMERGENCY — ALL OPERATIONS FROZEN",
         subtitle: "Emergency response teams have been notified. All operations are locked until every contact confirms safety." },
  };

  return (
    <>
      <ATMCard
        variant="dashboard"
        chipLabel="AGENT CONSOLE"
        balanceLabel="WORKING FLOAT"
        balancePrimary={`${num(agent.workingFloatSats)} sats`}
        balanceSecondary={`≈ KES ${num(Math.round(agent.workingFloatSats * rate.kesPerSat))} · ${agent.locationName}${criticalWorking ? " · ⚠ Critical" : lowWorking ? " · Float low" : ""}`}
        stats={[
          {
            label: "Working float",
            value: `${num(agent.workingFloatSats)} sats`,
            sub: `≈ KES ${num(Math.round(agent.workingFloatSats * rate.kesPerSat))}`,
            color: criticalWorking ? "#B94832" : lowWorking ? "#D06000" : undefined,
          },
          {
            label: "Reserve",
            value: `${num(agent.reserveSats)} sats`,
            sub: reservePending ? `Unlocks in ${fmtCountdown(reserveSecsLeft!)}` : "Locked",
            color: "#8ecb72",
          },
          {
            label: "Total earned",
            value: `+${num(agent.totalEarnedSats)} sats`,
            sub: `${(agent.commissionRate * 100).toFixed(1)}% rate · Till ${agent.mpesaTillNumber}`,
            color: "#8ecb72",
          },
        ]}
        actions={[
          { icon: "ti-user", label: "Guest Tx", onClick: () => setMode("guest") },
          { icon: "ti-user-check", label: "Member Tx", onClick: () => setMode("member") },
          { icon: "ti-bolt", label: "Top Up Float", onClick: () => openTx({ t: "topup" }) },
          { icon: "ti-history", label: "Activity", onClick: () => document.getElementById("agent-activity")?.scrollIntoView({ behavior: "smooth" }) },
        ]}
      />

      {/* ── PANIC OVERLAY ──────────────────────────────────────────────────── */}
      {panicked && (() => {
        const lvl  = agent.panicLevel as 1 | 2 | 3;
        const meta = PANIC_META[lvl];
        const required = agent.emergencyContacts.filter(c => agent.contactsRequired.includes(c.id));
        return (
          <div style={{
            position: "fixed", inset: 0, zIndex: 500,
            background: lvl === 3 ? "rgba(30,0,0,.97)" : "rgba(20,20,20,.93)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}>
            <div style={{
              width: "100%", maxWidth: 480,
              background: lvl === 3 ? "rgba(255,255,255,.04)" : "var(--ivory)",
              borderRadius: "var(--r-md)",
              border: `2px solid ${meta.accentColor}55`,
              padding: 28, display: "flex", flexDirection: "column", gap: 16,
              maxHeight: "92dvh", overflowY: "auto",
            }}>
              <div style={{ textAlign: "center" }}>
                <i className={`ti ${meta.icon}`} style={{ fontSize: 52, color: meta.accentColor }} />
                <h2 style={{ marginTop: 10, color: lvl === 3 ? "white" : undefined }}>{meta.title}</h2>
                <p className="note" style={{ marginTop: 6, color: lvl === 3 ? "rgba(255,255,255,.75)" : undefined }}>
                  {meta.subtitle}
                </p>
                {agent.panicLockedAt && (
                  <p className="note" style={{ marginTop: 4, color: "rgba(255,255,255,.4)", fontSize: 11 }}>
                    Locked at {new Date(agent.panicLockedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>

              {/* Reactivation codes */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {required.map(contact => {
                  const confirmed = reactivOk[contact.id] || agent.contactsConfirmed.includes(contact.id);
                  const tm = TIER_META[contact.tier];
                  return (
                    <div key={contact.id} style={{
                      padding: 14,
                      background: confirmed ? "rgba(17,166,91,.08)" : lvl === 3 ? "rgba(255,255,255,.06)" : "white",
                      border: `1.5px solid ${confirmed ? "var(--emerald-deep)" : `${tm.color}66`}`,
                      borderRadius: "var(--r-sm)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <i className={`ti ${tm.icon}`} style={{ color: confirmed ? "var(--emerald-deep)" : tm.color }} />
                        <strong style={{ color: lvl === 3 ? "white" : undefined }}>{contact.name}</strong>
                        <span className="note" style={{ marginLeft: "auto", fontSize: 11, color: lvl === 3 ? "rgba(255,255,255,.5)" : undefined }}>
                          {contact.phone}
                        </span>
                      </div>
                      {confirmed
                        ? <GoodNote msg="Confirmed — situation cleared by this contact." />
                        : (
                          <>
                            <div style={{ display: "flex", gap: 8 }}>
                              <input className="input" style={{ flex: 1 }}
                                placeholder={`Code from ${contact.name.split(" ")[0]}`}
                                value={reactivation[contact.id] ?? ""}
                                onChange={e => setReactivation(r => ({ ...r, [contact.id]: e.target.value }))} />
                              <Button onClick={() => submitCode(contact.id)}>Submit</Button>
                            </div>
                            {reactivErr[contact.id] && <ErrNote msg={reactivErr[contact.id]} />}
                          </>
                        )}
                    </div>
                  );
                })}
              </div>

              {/* Mock codes hint */}
              <div style={{ background: "rgba(255,255,255,.06)", borderRadius: "var(--r-sm)", padding: "8px 12px" }}>
                <p className="note" style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>
                  <i className="ti ti-info-circle" style={{ marginRight: 6 }} />
                  Test codes (mock only):&nbsp;
                  {required.map((c, i) => (
                    <span key={c.id}>
                      {i > 0 && " · "}
                      {c.name.split(" ")[0]}: <strong style={{ fontFamily: "var(--font-mono)" }}>
                        {c.id === "ec1" ? "SAFE-1111" : c.id === "ec2" ? "CLEAR-2222" : c.id === "ec3" ? "SECURE-3333" : "OK-4444"}
                      </strong>
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── HOME ────────────────────────────────────────────────────────────── */}
      {mode === null && (
        <div className="card" style={{ marginTop: 14, textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Who are you serving?</p>
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

      {/* ── GUEST ───────────────────────────────────────────────────────────── */}
      {mode === "guest" && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="section-head" style={{ marginBottom: 14 }}>
            <div><h2>Guest transactions</h2><p className="note">No YeboBank account needed.</p></div>
            <button onClick={() => setMode(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--soft)", fontSize: 13 }}>← Back</button>
          </div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 12, marginBottom: 8, color: "var(--soft)" }}>CASH & M-PESA</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <Tile icon="ti-cash" color="var(--gold)" label="Cash → M-Pesa" sub="Give cash, send M-Pesa" onClick={() => openTx({ t: "g_cash_mpesa" })} />
            <Tile icon="ti-device-mobile" color="var(--emerald-deep)" label="M-Pesa → Cash" sub="Receive M-Pesa, give cash" onClick={() => openTx({ t: "g_mpesa_cash" })} />
          </div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 12, marginBottom: 8, color: "var(--soft)" }}>LIGHTNING (via agent wallet)</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <Tile icon="ti-cash" color="var(--gold)" label="Cash → Lightning" sub="Give cash, receive sats" onClick={() => openTx({ t: "g_cash_ln" })} />
            <Tile icon="ti-device-mobile" color="var(--emerald-deep)" label="M-Pesa → Lightning" sub="Send M-Pesa, receive sats" onClick={() => openTx({ t: "g_mpesa_ln" })} />
            <Tile icon="ti-currency-bitcoin" color="#F7931A" label="Lightning → Cash" sub="Pay invoice, receive cash" onClick={() => openTx({ t: "g_ln_cash" })} warn={criticalWorking} />
            <Tile icon="ti-currency-bitcoin" color="#F7931A" label="Lightning → M-Pesa" sub="Pay invoice, receive M-Pesa" onClick={() => openTx({ t: "g_ln_mpesa" })} />
          </div>
          <div style={{ borderTop: "1px solid var(--border-soft)", paddingTop: 14 }}>
            <p style={{ color: "var(--soft)", fontSize: 13 }}>
              No account? Ask them to register at a YeboBank branch or via the app.
            </p>
          </div>
        </div>
      )}

      {/* ── MEMBER LOOKUP ───────────────────────────────────────────────────── */}
      {mode === "member" && !member && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="section-head" style={{ marginBottom: 14 }}>
            <h2>Member lookup</h2>
            <button onClick={() => setMode(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--soft)", fontSize: 13 }}>← Back</button>
          </div>
          <p className="note" style={{ marginBottom: 12 }}>Deposits don&apos;t require verification. Withdrawals and services do.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input className="input" placeholder="Phone (+254712... or 0712...)"
              value={phone} onChange={e => { setPhone(e.target.value); setLookErr(""); }} />
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

      {/* ── MEMBER DASHBOARD ────────────────────────────────────────────────── */}
      {mode === "member" && member && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="section-head" style={{ marginBottom: 4 }}>
            <div>
              <h2>{member.name ?? "Member"}</h2>
              <p className="note">{member.phone}
                {member.verified
                  ? <span style={{ color: "var(--emerald-deep)", marginLeft: 8 }}><i className="ti ti-shield-check" /> Verified</span>
                  : <span style={{ color: "var(--soft)", marginLeft: 8 }}><i className="ti ti-shield" /> Not verified</span>}
              </p>
            </div>
            <button onClick={() => { resetMember(); setMode(null); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--soft)", fontSize: 13 }}>
              New customer
            </button>
          </div>

          <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 12, margin: "16px 0 8px", color: "var(--soft)" }}>
            ADD MONEY <span style={{ fontSize: 11, fontWeight: 400 }}>(no verification required)</span>
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
            <Tile icon="ti-cash" color="var(--gold)" label="Cash" sub="Agent receives" onClick={() => openTx({ t: "m_dep_cash" })} />
            <Tile icon="ti-device-mobile" color="var(--emerald-deep)" label="M-Pesa" sub="Via agent till" onClick={() => openTx({ t: "m_dep_mpesa" })} />
            <Tile icon="ti-currency-bitcoin" color="#F7931A" label="Lightning" sub="Customer pays QR" onClick={() => openTx({ t: "m_dep_ln" })} />
          </div>

          <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 12, margin: "0 0 8px", color: "var(--soft)" }}>
            WITHDRAW <span style={{ fontSize: 11, fontWeight: 400 }}>(verification required)</span>
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
            <Tile icon="ti-cash" color="var(--gold)" label="Cash" sub="Agent gives cash" onClick={() => openTx({ t: "m_wdraw_cash" })} warn={criticalWorking} />
            <Tile icon="ti-device-mobile" color="var(--emerald-deep)" label="M-Pesa" sub="Agent sends M-Pesa" onClick={() => openTx({ t: "m_wdraw_mpesa" })} />
            <Tile icon="ti-currency-bitcoin" color="#F7931A" label="Lightning" sub="Pay their invoice" onClick={() => openTx({ t: "m_wdraw_ln" })} />
          </div>

          <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 12, margin: "0 0 8px", color: "var(--soft)" }}>
            SERVICES <span style={{ fontSize: 11, fontWeight: 400 }}>(verification required)</span>
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            <Tile icon="ti-lock" color="var(--forest)" label="Savings deposit" sub="Add to a savings goal" onClick={() => openTx({ t: "m_svc", kind: "savings_deposit" })} />
            <Tile icon="ti-users" color="var(--forest)" label="Chama contribution" sub="Pay into a chama" onClick={() => openTx({ t: "m_svc", kind: "chama_contribution" })} />
            <Tile icon="ti-file-invoice" color="var(--soft)" label="Withdrawal request" sub="Request from Mlinzi" onClick={() => openTx({ t: "m_svc", kind: "withdrawal_request" })} />
            <Tile icon="ti-bolt" color="#F7931A" label="Lightning send" sub="Send sats for them" onClick={() => openTx({ t: "m_svc", kind: "lightning_send" })} />
          </div>
          <div style={{ borderTop: "1px solid var(--border-soft)", paddingTop: 12 }}>
            <button onClick={() => { resetMember(); setMode("guest"); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gold)", fontSize: 13, fontWeight: 600 }}>
              Serve as guest instead
            </button>
          </div>
        </div>
      )}

      {/* ── RECENT ACTIVITY ─────────────────────────────────────────────────── */}
      <div id="agent-activity" className="card" style={{ marginTop: 10 }}>
        <div className="section-head"><h2>Recent activity</h2></div>
        {history.length === 0 && <p className="note">No transactions yet.</p>}
        {history.slice(0, 8).map((t) => <TransactionRow key={t.id} tx={t} />)}
      </div>

      {/* ── SECURITY SETTINGS ───────────────────────────────────────────────── */}
      <div className="card" style={{ marginTop: 10 }}>
        <button onClick={() => setShowSecurity(v => !v)} style={{
          width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 10, padding: 0,
        }}>
          <i className="ti ti-shield-lock" style={{ fontSize: 18, color: "var(--forest)" }} />
          <div style={{ flex: 1 }}>
            <strong>Security settings</strong>
            <p className="note" style={{ marginTop: 2 }}>Reserve float · Panic contacts · PIN</p>
          </div>
          <i className={`ti ti-chevron-${showSecurity ? "up" : "down"}`} style={{ color: "var(--soft)" }} />
        </button>

        {showSecurity && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Reserve explanation */}
            <div style={{ background: "var(--ivory)", borderRadius: "var(--r-sm)", padding: 14 }}>
              <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                <i className="ti ti-lock" style={{ color: "var(--emerald-deep)", marginRight: 8 }} />Reserve float protection
              </p>
              <p className="note">
                Keep your <strong>working float</strong> small — only what you need for today.
                Lock the rest in the <strong>reserve</strong>.
                If robbed, attackers can only take the working float. The reserve requires your PIN
                and a <strong>60-second countdown</strong> (15 min in production) — long enough for a robber to give up.
              </p>
              <p className="note" style={{ marginTop: 6 }}>
                Mock reserve PIN: <strong style={{ fontFamily: "var(--font-mono)" }}>1234</strong>
              </p>
            </div>

            {/* Panic system */}
            <div>
              <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                <i className="ti ti-urgent" style={{ color: "var(--terra-text)", marginRight: 8 }} />Panic escalation system
              </p>
              <p className="note" style={{ marginBottom: 12 }}>
                Tap the <strong>Confirm</strong> button multiple times rapidly during any transaction.
                Each extra tap escalates to the next level — without any visible change to the robber watching.
              </p>

              {(Object.entries(TIER_META) as [ContactTier, typeof TIER_META[ContactTier]][]).map(([tier, meta]) => {
                const contacts = (draftContacts ?? agent.emergencyContacts).filter(c => c.tier === tier);
                return (
                  <div key={tier} style={{
                    borderLeft: `3px solid ${meta.color}`, paddingLeft: 14,
                    marginBottom: 16,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <i className={`ti ${meta.icon}`} style={{ color: meta.color }} />
                      <strong style={{ fontSize: 13 }}>{meta.tapCount}× tap — {meta.label}</strong>
                    </div>
                    <p className="note" style={{ marginBottom: 8 }}>{meta.desc}</p>
                    {contacts.map(c => (
                      <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                        {draftContacts
                          ? (
                            <>
                              <input className="input" style={{ flex: 2, fontSize: 12 }} placeholder="Name"
                                value={c.name} onChange={e => updateContact(c.id, "name", e.target.value)} />
                              <input className="input" style={{ flex: 2, fontSize: 12 }} placeholder="Phone"
                                value={c.phone} onChange={e => updateContact(c.id, "phone", e.target.value)} />
                              <button onClick={() => removeContact(c.id)} style={{
                                background: "none", border: "none", cursor: "pointer", color: "var(--terra-text)", flexShrink: 0,
                              }}><i className="ti ti-trash" /></button>
                            </>
                          )
                          : (
                            <p className="note" style={{ fontSize: 12 }}>
                              <i className="ti ti-user" style={{ marginRight: 6 }} />{c.name} · {c.phone}
                            </p>
                          )}
                      </div>
                    ))}
                    {draftContacts && (
                      <button onClick={() => addContact(tier)} style={{
                        background: "none", border: `1px dashed ${meta.color}55`,
                        cursor: "pointer", borderRadius: "var(--r-sm)",
                        padding: "5px 12px", fontSize: 12, color: "var(--soft)",
                      }}>
                        <i className="ti ti-plus" /> Add {meta.label} contact
                      </button>
                    )}
                  </div>
                );
              })}

              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                {draftContacts
                  ? (
                    <>
                      <Button disabled={savingContacts} onClick={saveContacts}>{savingContacts ? "Saving…" : "Save contacts"}</Button>
                      <Button variant="ghost" onClick={() => setDraftContacts(null)}>Cancel</Button>
                    </>
                  )
                  : <Button variant="ghost" onClick={startEditContacts}><i className="ti ti-edit" /> Edit contacts</Button>
                }
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── TRANSACTION MODAL ────────────────────────────────────────────────── */}
      {tx && (
        <div className="modal-overlay" onClick={closeTx}>
          <div className="modal" style={{ maxHeight: "90dvh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeTx}>&times;</button>

            {/* VERIFICATION GATE */}
            {needsVerify && member && (
              <>
                <h2>Verify identity</h2>
                <VerifyStep member={member} channel={channel} codeSent={codeSent} code={code}
                  error={txErr} verifying={verifying}
                  onSendCode={sendCode} onCodeChange={v => { setCode(v); setTxErr(""); }}
                  onVerify={doVerify} onCancel={closeTx} />
              </>
            )}

            {/* POST-DEPOSIT FORWARD */}
            {!needsVerify && tx.t === "post_dep" && member && (
              <>
                <h2><i className="ti ti-circle-check" style={{ color: "var(--emerald-deep)", marginRight: 8 }} />Deposit complete</h2>
                <GoodNote msg={`${num(tx.sats)} sats added to ${member.name ?? member.phone}'s wallet.`} />
                <p className="modal-sub" style={{ marginTop: 12 }}>What next?</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                  {[
                    { icon: "ti-wallet",  label: "Keep in wallet",     sub: "Done — sats stay in account",       action: () => { closeTx(); load(); } },
                    { icon: "ti-bolt",    label: "Send via Lightning",  sub: "Send to another wallet immediately", action: () => openTx({ t: "m_wdraw_ln" }) },
                    { icon: "ti-lock",    label: "Deposit to savings",  sub: "Move into a locked savings goal",    action: () => openTx({ t: "m_svc", kind: "savings_deposit" }) },
                    { icon: "ti-users",   label: "Contribute to chama", sub: "Pay into a group savings pool",      action: () => openTx({ t: "m_svc", kind: "chama_contribution" }) },
                  ].map(o => (
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

            {/* RESERVE RELEASE / CLAIM */}
            {!needsVerify && tx.t === "reserve_release" && (
              <>
                <h2>
                  <i className={`ti ${reserveReady ? "ti-lock-open" : "ti-lock"}`}
                    style={{ color: "var(--emerald-deep)", marginRight: 8 }} />
                  {reserveReady ? "Claim reserve funds" : reservePending ? "Release in progress" : "Release reserve float"}
                </h2>
                {reserveReady && (
                  <>
                    <GoodNote msg={`${num(agent.reserveSats)} sats ready to move to your working float.`} />
                    <div className="modal-actions">
                      <Button disabled={submitting} onClick={handleClaimReserve}>{submitting ? "Claiming…" : "Claim reserve"}</Button>
                      <Button variant="ghost" onClick={closeTx}>Cancel</Button>
                    </div>
                  </>
                )}
                {reservePending && (
                  <>
                    <p className="modal-sub">Security countdown: <strong>{fmtCountdown(reserveSecsLeft!)}</strong></p>
                    <p className="note" style={{ marginTop: 8 }}>
                      Under duress: do not share your PIN. Let the timer run — most robbers leave rather than wait.
                      Your reserve is safe until you actively claim it after the countdown.
                    </p>
                    <div className="modal-actions"><Button variant="ghost" onClick={closeTx}>Close</Button></div>
                  </>
                )}
                {!reserveReady && !reservePending && (
                  <>
                    <p className="modal-sub">
                      Enter your reserve PIN to start the security countdown.
                      The timer is visible on screen — you can tell a robber &ldquo;the system is making me wait.&rdquo;
                    </p>
                    <input className="input" type="password" placeholder="Reserve PIN"
                      value={reservePin} onChange={e => { setReservePin(e.target.value); setReservePinErr(""); }} />
                    {reservePinErr && <ErrNote msg={reservePinErr} />}
                    <p className="note" style={{ marginTop: 6 }}>Mock PIN: <strong style={{ fontFamily: "var(--font-mono)" }}>1234</strong></p>
                    <div className="modal-actions">
                      <Button disabled={!reservePin || submitting} onClick={handleReserveRelease}>
                        {submitting ? "Verifying…" : "Start release"}
                      </Button>
                      <Button variant="ghost" onClick={closeTx}>Cancel</Button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* MOVE TO RESERVE */}
            {!needsVerify && tx.t === "move_to_reserve" && (
              <>
                <h2><i className="ti ti-lock" style={{ color: "var(--forest)", marginRight: 8 }} />Add to reserve</h2>
                <p className="modal-sub">
                  Lock sats away from your working float. Recommended working float: KES {num(Math.round(LOW_FLOAT * rate.kesPerSat))} or less.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input className="input" type="number" min="1" placeholder="Amount (sats)"
                    value={moveAmount} onChange={e => { setMoveAmount(e.target.value); setTxErr(""); }} />
                  {moveAmount && Number(moveAmount) > 0 && (
                    <p className="note">
                      ≈ KES {num(Math.round(Number(moveAmount) * rate.kesPerSat))} ·
                      Working float after: {num(Math.max(0, agent.workingFloatSats - Number(moveAmount)))} sats
                    </p>
                  )}
                  {txErr && <ErrNote msg={txErr} />}
                </div>
                <div className="modal-actions">
                  <Button disabled={!moveAmount || Number(moveAmount) <= 0 || submitting} onClick={handleMoveToReserve}>
                    {submitting ? "Moving…" : "Move to reserve"}
                  </Button>
                  <Button variant="ghost" onClick={closeTx}>Cancel</Button>
                </div>
              </>
            )}

            {/* FLOAT TOP-UP */}
            {!needsVerify && tx.t === "topup" && (
              <>
                <h2><i className="ti ti-bolt" style={{ color: "#F7931A", marginRight: 8 }} />Top up working float</h2>
                <p className="modal-sub">Generate a Lightning invoice and pay it from your personal wallet.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <input className="input" type="number" min="1" placeholder="Amount (sats)"
                      value={rawAmount} onChange={e => { setRawAmount(e.target.value); setTopupInv(null); setTxErr(""); }} />
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
                    {submitting ? "Confirming…" : "Confirm — I've paid"}
                  </Button>
                  <Button variant="ghost" onClick={closeTx}>Cancel</Button>
                </div>
              </>
            )}

            {/* ALL TRANSACTION FORMS */}
            {!needsVerify && tx.t !== "post_dep" && tx.t !== "topup" &&
             tx.t !== "reserve_release" && tx.t !== "move_to_reserve" && (
              <>
                <h2>{txTitle(tx, member)}</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                  {(tx.t === "g_mpesa_cash" || tx.t === "g_mpesa_ln" || tx.t === "m_dep_mpesa") && (
                    <GoodNote msg={`Ask customer to send M-Pesa to your till: ${agent.mpesaTillNumber}`} />
                  )}

                  {(tx.t === "g_cash_ln" || tx.t === "g_mpesa_ln" || tx.t === "m_dep_cash" ||
                    tx.t === "m_wdraw_cash" || tx.t === "m_wdraw_mpesa" || tx.t === "m_wdraw_ln" ||
                    (tx.t === "m_svc" && tx.kind !== "lightning_send")) && (
                    <UnitToggle useKes={useKes} onToggle={b => { setUseKes(b); setRawAmount(""); setTxErr(""); }} />
                  )}

                  {tx.t !== "g_ln_cash" && tx.t !== "g_ln_mpesa" && tx.t !== "m_dep_ln" && (
                    <div>
                      <input className="input" type="number" min="0"
                        placeholder={
                          tx.t === "g_cash_mpesa" || tx.t === "g_mpesa_cash" || tx.t === "m_dep_mpesa"
                            ? "Amount (KES)" : useKes ? "Amount (KES)" : "Amount (sats)"
                        }
                        value={rawAmount}
                        onChange={e => { setRawAmount(e.target.value); setLnInvoice(null); setTxErr(""); }} />
                      {rawAmount && Number(rawAmount) > 0 && <p className="note" style={{ marginTop: 5 }}>{preview()}</p>}
                    </div>
                  )}

                  {(tx.t === "g_ln_cash" || tx.t === "g_ln_mpesa" || tx.t === "m_dep_ln") && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <input className="input" type="number" min="1" placeholder="Amount (sats)"
                          value={rawAmount}
                          onChange={e => { setRawAmount(e.target.value); setLnInvoice(null); setTxErr(""); }} />
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

                  {(tx.t === "g_cash_mpesa" || tx.t === "g_ln_mpesa" || tx.t === "m_wdraw_mpesa") && (
                    <input className="input" placeholder="Destination M-Pesa number (+254... or 07...)"
                      value={mpesaDest} onChange={e => { setMpesaDest(e.target.value); setTxErr(""); }} />
                  )}

                  {(tx.t === "g_mpesa_cash" || tx.t === "g_mpesa_ln" || tx.t === "m_dep_mpesa") && (
                    <input className="input" placeholder="M-Pesa reference code (optional)"
                      value={mpesaRef} onChange={e => setMpesaRef(e.target.value)} />
                  )}

                  {(tx.t === "g_cash_ln" || tx.t === "g_mpesa_ln" || tx.t === "m_wdraw_ln" ||
                    (tx.t === "m_svc" && tx.kind === "lightning_send")) && (
                    <ScanRow value={lnDest} onChange={v => { setLnDest(v); setTxErr(""); }}
                      onScan={() => setScanning(true)}
                      placeholder="Customer's Lightning invoice or address" />
                  )}

                  {tx.t === "m_wdraw_cash" && lowWorking && (
                    <ErrNote msg={`Working float low (${num(agent.workingFloatSats)} sats). Consider releasing reserve first.`} />
                  )}

                  {(tx.t === "g_mpesa_cash" || tx.t === "g_mpesa_ln" || tx.t === "m_dep_mpesa") && (
                    <button onClick={() => setReceiptOk(v => !v)} style={{
                      textAlign: "left", padding: "10px 14px", cursor: "pointer",
                      background: receiptOk ? "rgba(17,166,91,.08)" : "var(--ivory)",
                      border: `1.5px solid ${receiptOk ? "var(--emerald-deep)" : "var(--border)"}`,
                      borderRadius: "var(--r-sm)",
                    }}>
                      <i className={`ti ${receiptOk ? "ti-checkbox" : "ti-square"}`}
                        style={{ marginRight: 8, color: receiptOk ? "var(--emerald-deep)" : "var(--soft)" }} />
                      <strong>I have received the M-Pesa</strong>
                      <p className="note" style={{ marginTop: 3 }}>Only confirm after you see the credit in your M-Pesa.</p>
                    </button>
                  )}

                  {txErr && <ErrNote msg={txErr} />}

                  <p className="note" style={{ fontSize: 10, color: "var(--border-soft)" }}>
                    1 tap = confirm · 2 taps = personal alert · 3 = police · 4 = emergency lock
                  </p>
                </div>

                <div className="modal-actions">
                  <ConfirmButton
                    disabled={
                      submitting || panicExecuting ||
                      ((tx.t === "g_ln_cash" || tx.t === "g_ln_mpesa" || tx.t === "m_dep_ln") && !lnInvoice)
                    }
                    label={
                      submitting || panicExecuting ? "Processing…"
                      : tx.t === "g_ln_mpesa"   ? "Confirm — send M-Pesa"
                      : tx.t === "m_dep_ln"      ? "Confirm — credit wallet"
                      : tx.t === "g_ln_cash"     ? "Confirm — give cash"
                      : txConfirmLabel(tx)
                    }
                    onConfirm={handleConfirmWithLevel}
                  />
                  <Button variant="ghost" onClick={closeTx}>Cancel</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {scanning && (
        <QRScanner onScan={val => { setLnDest(val); setScanning(false); }} onClose={() => setScanning(false)} />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Label helpers
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
