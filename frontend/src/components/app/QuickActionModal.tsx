"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Button from "@/components/ui/Button";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import { depositMpesa, depositLightning, withdrawMpesa, sendLightning, createLock } from "@/lib/api";

import SecurityTransactionGuard from "@/components/ui/SecurityTransactionGuard";

export type QuickActionKind = "deposit" | "withdraw" | "send" | "lock";

const META: Record<QuickActionKind, { title: string; icon: string; subtitle: string }> = {
  deposit:  { title: "Deposit",        icon: "ti-arrow-down", subtitle: "Top up your wallet via M-Pesa or Lightning" },
  withdraw: { title: "Withdraw",       icon: "ti-arrow-up",   subtitle: "Withdraw sats directly to M-Pesa cash" },
  send:     { title: "Send",           icon: "ti-send",       subtitle: "Send instant Bitcoin sats globally" },
  lock:     { title: "Lock Savings",   icon: "ti-lock",       subtitle: "Earn ~5.2% APY real yield in Bitcoin" },
};

interface Props {
  kind:    QuickActionKind;
  onClose: () => void;
  onDone?: () => void;
}

export default function QuickActionModal({ kind, onClose, onDone }: Props) {
  const rate = useRate();
  const [mounted, setMounted] = useState(false);
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const kesNum      = parseFloat(kes.replace(/[^0-9.]/g, "")) || 0;
  const sendSatsNum = parseInt(sendSats.replace(/\D/g, ""), 10) || 0;
  const lockSatsNum = parseInt(lockSats.replace(/\D/g, ""), 10) || 0;

  // Conversions for hints
  const satsFromKes = Math.round(kesNum * rate.satsPerKes);
  const kesFromSend = sendSatsNum * rate.kesPerSat;
  const kesFromLock = lockSatsNum * rate.kesPerSat;

  // Determine current transaction amount and currency for SecurityTransactionGuard
  const currentAmount =
    kind === "send" ? sendSatsNum :
    kind === "lock" ? lockSatsNum :
    kesNum;

  const currentCurrency = (kind === "send" || kind === "lock") ? "sats" : "KES";

  function copyInvoice() {
    if (!invoice) return;
    navigator.clipboard.writeText(invoice).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);

    try {
      if (kind === "deposit") {
        if (kesNum <= 0) throw new Error("Enter an amount to deposit");
        if (method === "mpesa") {
          const res = await depositMpesa(kesNum);
          setResultAmt(`KES ${num(kesNum)}`);
          setResultMsg(`STK Push initiated (ref: ${res.checkoutRequestId || "pending"}). Check your phone to enter your M-Pesa PIN.`);
        } else {
          const res = await depositLightning(satsFromKes);
          setResultAmt(`${num(satsFromKes)} sats`);
          setResultMsg("Pay this Lightning invoice to complete your deposit:");
          setInvoice(res.invoice || "");
        }
      } else if (kind === "withdraw") {
        if (kesNum <= 0) throw new Error("Enter an amount to withdraw");
        await withdrawMpesa(satsFromKes);
        setResultAmt(`KES ${num(kesNum)}`);
        setResultMsg(`Withdrawal initiated. Funds will arrive on your M-Pesa shortly.`);
      } else if (kind === "send") {
        if (!dest.trim()) throw new Error("Enter a recipient address or invoice");
        if (sendSatsNum <= 0) throw new Error("Enter sats to send");
        await sendLightning(dest.trim(), sendSatsNum);
        setResultAmt(`${num(sendSatsNum)} sats`);
        setResultMsg(`Sent successfully via Lightning network.`);
      } else if (kind === "lock") {

        if (lockSatsNum <= 0) throw new Error("Enter sats to lock");
        await createLock(lockSatsNum, lockYears);
        setResultAmt(`${num(lockSatsNum)} sats`);
        setResultMsg(`Locked for ${lockYears} year${lockYears > 1 ? "s" : ""}. Your savings are growing at 5.2% APY.`);
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
    kind === "deposit"   ? "Deposit"  :
    kind === "withdraw"  ? "Withdraw" :
    kind === "send"      ? "Send"     :
    "Lock";

  if (!mounted) return null;

  return createPortal(
    <>
      <div className="qa-backdrop" onClick={onClose} />

      <div className="qa-modal" role="dialog" aria-modal="true" style={{ maxWidth: 440 }}>
        {/* Header with 3D tactile icon badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 22px",
            borderBottom: "1px solid var(--border-soft)",
            background: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "linear-gradient(135deg, rgba(240, 204, 88, 0.2) 0%, rgba(240, 204, 88, 0.05) 100%)",
                border: "1px solid rgba(240, 204, 88, 0.35)",
                display: "grid",
                placeItems: "center",
                fontSize: 19,
                color: "var(--gold-text)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                flexShrink: 0,
              }}
            >
              <i className={`ti ${meta.icon}`} />
            </div>
            <div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 17,
                  color: "var(--text)",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {meta.title}
              </h3>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  margin: "2px 0 0",
                  lineHeight: 1.3,
                }}
              >
                {meta.subtitle}
              </p>
            </div>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
            style={{ position: "static" }}
          >
            <i className="ti ti-x" />
          </button>
        </div>

        <div className="qa-body" style={{ padding: "20px 22px" }}>
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
                    className="input"
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
                      <div className="qa-hint-content">
                        <span className="qa-hint-label">Recipient receives:</span>
                        <span className="qa-hint-value">KES {num(kesFromSend, 2)}</span>
                        <span className="qa-hint-sub">at current market rate</span>
                      </div>
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
                        placeholder="50 000"
                        value={lockSats}
                        onChange={(e) => setLockSats(e.target.value)}
                        autoFocus
                      />
                    </div>
                    {lockSatsNum > 0 && (
                      <div className="qa-hint">
                        <div className="qa-hint-content">
                          <span className="qa-hint-label">You lock:</span>
                          <span className="qa-hint-value">KES {num(kesFromLock, 2)}</span>
                          <span className="qa-hint-sub">· Yield: 5.2% p.a.</span>
                        </div>
                      </div>
                    )}
                  </div>


                  <div className="qa-field">
                    <label className="qa-lbl">Lock duration</label>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: 8,
                        background: "var(--cream)",
                        padding: 4,
                        borderRadius: 12,
                        border: "1px solid var(--border-soft)",
                      }}
                    >
                      {[1, 3, 5, 7].map((y) => {
                        const isSelected = lockYears === y;
                        return (
                          <button
                            key={y}
                            type="button"
                            onClick={() => setLockYears(y)}
                            style={{
                              padding: "9px 0",
                              fontSize: 13,
                              fontWeight: isSelected ? 700 : 500,
                              fontFamily: "var(--font-mono)",
                              borderRadius: 8,
                              border: "none",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              background: isSelected
                                ? "linear-gradient(180deg, #F5D770 0%, #D8A928 100%)"
                                : "transparent",
                              color: isSelected ? "#07160F" : "var(--muted)",
                              boxShadow: isSelected
                                ? "0 2px 8px rgba(240, 204, 88, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.4)"
                                : "none",
                              transform: isSelected ? "translateY(-1px)" : "none",
                            }}
                          >
                            {y}y
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                /* deposit / withdraw: KES input */
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
                      <div className="qa-hint-content">
                        <span className="qa-hint-label">{kind === "withdraw" ? "Debits from balance:" : "You receive:"}</span>
                        <span className="qa-hint-value">{num(satsFromKes)} sats</span>
                        <span className="qa-hint-sub">{kind === "withdraw" ? "" : "credited instantly"}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {error && <div className="qa-error">{error}</div>}

              {currentAmount > 0 ? (
                <SecurityTransactionGuard
                  amount={currentAmount}
                  currencyName={currentCurrency}
                  onConfirm={() => void handleSubmit()}
                  onClose={onClose}
                  confirmLabel={submitLabel}
                  loading={loading}
                />
              ) : (
                <Button
                  variant="primary"
                  onClick={() => void handleSubmit()}
                  disabled={loading || currentAmount <= 0}
                  block
                  style={{
                    borderRadius: 12,
                    padding: "13px",
                    fontWeight: 700,
                    boxShadow: "0 4px 16px rgba(240, 204, 88, 0.35)",
                  }}
                >
                  {submitLabel}
                </Button>
              )}
            </>
          ) : (
            /* ── Result phase ── */
            <div className="qa-result" style={{ textAlign: "center", padding: "10px 0" }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "rgba(28, 180, 96, 0.15)",
                  border: "1px solid rgba(28, 180, 96, 0.3)",
                  color: "var(--emerald-deep)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 26,
                  margin: "0 auto 14px",
                  boxShadow: "0 4px 16px rgba(28, 180, 96, 0.2)",
                }}
              >
                <i className="ti ti-circle-check" />
              </div>

              <div className="qa-result-amount" style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 22, color: "var(--text)", marginBottom: 6 }}>
                {resultAmt}
              </div>
              <p className="qa-result-msg" style={{ fontSize: 13.5, color: "var(--muted)", margin: "0 0 16px" }}>
                {resultMsg}
              </p>

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

              <Button
                variant="primary"
                onClick={onClose}
                block
                style={{ borderRadius: 12, padding: "12px", marginTop: 12 }}
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
