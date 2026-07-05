"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import { depositMpesa, depositLightning, withdrawMpesa, sendLightning, createLock } from "@/lib/api";

export type QuickActionKind = "deposit" | "withdraw" | "send" | "lock";

const META: Record<QuickActionKind, { title: string; icon: string }> = {
  deposit:  { title: "Add Money",    icon: "ti-arrow-down" },
  withdraw: { title: "Withdraw",     icon: "ti-arrow-up" },
  send:     { title: "Send",         icon: "ti-send" },
  lock:     { title: "Lock Savings", icon: "ti-lock" },
};

interface Props {
  kind:    QuickActionKind;
  onClose: () => void;
  onDone?: () => void;
}

export default function QuickActionModal({ kind, onClose, onDone }: Props) {
  const rate = useRate();
  const [phase,   setPhase]   = useState<"form" | "result">("form");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // KES amount — used for deposit and withdraw
  const [kes, setKes] = useState("");
  // deposit method toggle
  const [method, setMethod] = useState<"mpesa" | "lightning">("mpesa");
  // send fields
  const [dest,     setDest]     = useState("");
  const [sendSats, setSendSats] = useState("");
  // lock fields
  const [lockSats,  setLockSats]  = useState("");
  const [lockYears, setLockYears] = useState(1);
  // result
  const [resultAmt, setResultAmt] = useState("");
  const [resultMsg, setResultMsg] = useState("");
  const [invoice,   setInvoice]   = useState("");
  const [copied,    setCopied]    = useState(false);

  const kesNum      = parseFloat(kes.replace(/[^0-9.]/g, "")) || 0;
  const satsFromKes = Math.round(kesNum * rate.satsPerKes);
  const sendSatsNum = parseInt(sendSats.replace(/[^0-9]/g, ""), 10) || 0;
  const lockSatsNum = parseInt(lockSats.replace(/[^0-9]/g, ""), 10) || 0;

  function copyInvoice() {
    if (navigator.clipboard) navigator.clipboard.writeText(invoice);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      if (kind === "deposit") {
        if (!kesNum || kesNum <= 0) throw new Error("Enter a valid amount");
        if (method === "mpesa") {
          await depositMpesa(kesNum);
          setResultAmt(`KES ${num(kesNum, 0)}`);
          setResultMsg("STK Push sent to your phone. Enter your M-Pesa PIN to confirm the deposit.");
        } else {
          const res = await depositLightning(satsFromKes);
          setInvoice(res.invoice);
          setResultAmt(`${num(satsFromKes)} sats`);
          setResultMsg("Lightning invoice ready. Scan or copy it to complete the deposit.");
        }
      } else if (kind === "withdraw") {
        if (!kesNum || kesNum <= 0) throw new Error("Enter a valid amount");
        await withdrawMpesa(satsFromKes);
        setResultAmt(`KES ${num(kesNum, 0)}`);
        setResultMsg("On its way — shillings will arrive in your M-Pesa within moments.");
      } else if (kind === "send") {
        if (!dest.trim()) throw new Error("Enter a Lightning address or invoice");
        if (!sendSatsNum || sendSatsNum <= 0) throw new Error("Enter a valid amount");
        await sendLightning(dest.trim(), sendSatsNum);
        setResultAmt(`${num(sendSatsNum)} sats`);
        setResultMsg(`Sent to ${dest.trim()}.`);
      } else {
        if (!lockSatsNum || lockSatsNum <= 0) throw new Error("Enter an amount to lock");
        await createLock(lockSatsNum, lockYears);
        setResultAmt(`${num(lockSatsNum)} sats`);
        setResultMsg(`Locked for ${lockYears} year${lockYears > 1 ? "s" : ""}. Your savings are growing.`);
      }
      setPhase("result");
      onDone?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't complete that — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const meta = META[kind];

  const submitLabel =
    kind === "deposit" && method === "mpesa"      ? "Send STK Push"      :
    kind === "deposit" && method === "lightning"  ? "Generate invoice"   :
    kind === "withdraw"                           ? "Withdraw to M-Pesa" :
    kind === "send"                               ? "Send now"           :
    "Lock savings";

  return (
    <>
      <div className="qa-backdrop" onClick={onClose} />

      <div className="qa-modal" role="dialog" aria-modal="true">

        {/* Header */}
        <div className="qa-hd">
          <span className={`qa-hd-icon qa-hd-icon--${kind}`}>
            <i className={`ti ${meta.icon}`} />
          </span>
          <span className="qa-hd-title">{meta.title}</span>
          <button className="qa-hd-close" onClick={onClose} aria-label="Close">
            <i className="ti ti-x" />
          </button>
        </div>

        <div className="qa-body">
          {phase === "form" ? (
            <>
              {/* Deposit: method toggle */}
              {kind === "deposit" && (
                <div className="seg">
                  <button className={method === "mpesa"     ? "on" : ""} onClick={() => setMethod("mpesa")}>
                    <i className="ti ti-device-mobile" /> M-Pesa
                  </button>
                  <button className={method === "lightning" ? "on" : ""} onClick={() => setMethod("lightning")}>
                    <i className="ti ti-bolt" /> Lightning
                  </button>
                </div>
              )}

              {/* Send: destination */}
              {kind === "send" && (
                <div className="qa-field">
                  <label className="qa-lbl">To</label>
                  <input
                    className="qa-input"
                    type="text"
                    placeholder="you@wallet.com or lnbc…"
                    value={dest}
                    onChange={(e) => setDest(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
              )}

              {/* Amount input — variant per kind */}
              {kind === "send" ? (
                <div className="qa-field">
                  <label className="qa-lbl">Amount in sats</label>
                  <div className="qa-amount-wrap">
                    <input
                      className="qa-amount-input"
                      type="text"
                      inputMode="numeric"
                      placeholder="10 000"
                      value={sendSats}
                      onChange={(e) => setSendSats(e.target.value)}
                    />
                  </div>
                  {sendSatsNum > 0 && (
                    <div className="qa-hint">
                      <i className="ti ti-arrows-exchange" />
                      ≈ KES {num(sendSatsNum * rate.kesPerSat, 2)} &middot; free to other YeboBank members
                    </div>
                  )}
                </div>
              ) : kind === "lock" ? (
                <>
                  <div className="qa-field">
                    <label className="qa-lbl">Amount to lock (sats)</label>
                    <div className="qa-amount-wrap">
                      <input
                        className="qa-amount-input"
                        type="text"
                        inputMode="numeric"
                        placeholder="100 000"
                        value={lockSats}
                        onChange={(e) => setLockSats(e.target.value)}
                      />
                    </div>
                    {lockSatsNum > 0 && (
                      <div className="qa-hint">
                        <i className="ti ti-trending-up" />
                        ≈ KES {num(lockSatsNum * rate.kesPerSat, 2)} at today&apos;s rate
                      </div>
                    )}
                  </div>
                  <div className="qa-field">
                    <label className="qa-lbl">Lock duration</label>
                    <div className="seg">
                      {([1, 3, 5, 7] as const).map((y) => (
                        <button key={y} className={lockYears === y ? "on" : ""} onClick={() => setLockYears(y)}>
                          {y}y
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* deposit or withdraw — KES amount */
                <div className="qa-field">
                  <label className="qa-lbl">
                    {kind === "withdraw" ? "Amount to withdraw (KES)" : "Amount (KES)"}
                  </label>
                  <div className="qa-amount-wrap">
                    <span className="qa-amount-pfx">KES</span>
                    <input
                      className="qa-amount-input qa-amount-input--kes"
                      type="text"
                      inputMode="decimal"
                      placeholder="500"
                      value={kes}
                      onChange={(e) => setKes(e.target.value)}
                    />
                  </div>
                  {kesNum > 0 && (
                    <div className="qa-hint">
                      <i className="ti ti-arrows-exchange" />
                      {kind === "deposit"
                        ? `You'll receive ≈ ${num(satsFromKes)} sats at today's rate`
                        : `Debits ≈ ${num(satsFromKes)} sats from your balance`
                      }
                    </div>
                  )}
                </div>
              )}

              {error && <div className="qa-error">{error}</div>}

              <Button
                variant="primary"
                onClick={() => void handleSubmit()}
                disabled={loading}
                block
              >
                {loading ? "Processing…" : submitLabel}
              </Button>
            </>
          ) : (
            /* ── Result phase ── */
            <div className="qa-result">
              <div className="qa-check-ring">
                <i className="ti ti-circle-check" />
              </div>

              <div className="qa-result-amount">{resultAmt}</div>
              <p className="qa-result-msg">{resultMsg}</p>

              {/* Lightning invoice */}
              {invoice && (
                <div className="qa-invoice">
                  <span>{invoice}</span>
                  <button
                    className={`qa-invoice-cpy${copied ? " copied" : ""}`}
                    onClick={copyInvoice}
                  >
                    <i className={`ti ${copied ? "ti-check" : "ti-copy"}`} />
                    {copied ? "Copied!" : "Copy invoice"}
                  </button>
                </div>
              )}

              {/* M-Pesa STK push notice */}
              {kind === "deposit" && method === "mpesa" && (
                <div className="qa-stk-notice">
                  <i className="ti ti-device-mobile" />
                  <span>A prompt has been sent to your phone. Open it and enter your M-Pesa PIN to confirm.</span>
                </div>
              )}

              <Button variant="ghost" onClick={onClose} block>Done</Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
