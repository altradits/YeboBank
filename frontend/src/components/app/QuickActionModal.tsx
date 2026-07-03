"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { useRate } from "@/lib/rate-context";
import { num, kesToSats } from "@/lib/format";
import { depositMpesa, depositLightning, withdrawMpesa, sendLightning, createLock } from "@/lib/api";

export type QuickActionKind = "deposit" | "withdraw" | "send" | "lock";

const TITLES: Record<QuickActionKind, string> = {
  deposit:  "Add Money",
  withdraw: "Withdraw",
  send:     "Send",
  lock:     "Lock Savings",
};

interface Props {
  kind:     QuickActionKind;
  onClose:  () => void;
  onDone?:  () => void;
}

export default function QuickActionModal({ kind, onClose, onDone }: Props) {
  const rate = useRate();
  const [phase, setPhase]   = useState<"form" | "result">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  // shared number field (KES for deposit-mpesa, sats otherwise)
  const [amount, setAmount] = useState("");
  // method toggle
  const [method, setMethod] = useState<"mpesa" | "lightning">("mpesa");
  // send fields
  const [destination, setDestination] = useState("");
  const [sendSats, setSendSats]       = useState("");
  // lock field
  const [lockYears, setLockYears] = useState(1);
  // results
  const [resultMsg, setResultMsg] = useState("");
  const [invoice, setInvoice]     = useState("");

  const amountLabel = (() => {
    if (kind === "deposit") return method === "mpesa" ? "Amount (KES)" : "Amount (sats)";
    if (kind === "withdraw") return "Amount (sats)";
    return "Amount (sats)";
  })();

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const n = parseFloat(amount);

      if (kind === "deposit") {
        if (!n || n <= 0) throw new Error("Enter a valid amount");
        if (method === "mpesa") {
          const sats = kesToSats(n, rate);
          await depositMpesa(sats);
          setResultMsg(`M-Pesa STK push sent for KES ${num(n, 0)}. Check your phone.`);
        } else {
          const res = await depositLightning(Math.round(n));
          setInvoice(res.invoice);
          setResultMsg(`Lightning invoice ready for ${num(Math.round(n))} sats.`);
        }
      } else if (kind === "withdraw") {
        if (!n || n <= 0) throw new Error("Enter a valid amount");
        await withdrawMpesa(Math.round(n));
        setResultMsg(`Withdrawal of ${num(Math.round(n))} sats initiated via M-Pesa.`);
      } else if (kind === "send") {
        const s = parseFloat(sendSats);
        if (!destination.trim()) throw new Error("Enter a Lightning address or invoice");
        if (!s || s <= 0) throw new Error("Enter a valid amount in sats");
        await sendLightning(destination.trim(), Math.round(s));
        setResultMsg(`Sent ${num(Math.round(s))} sats to ${destination.trim()}.`);
      } else {
        if (!n || n <= 0) throw new Error("Enter a valid amount");
        await createLock(Math.round(n), lockYears);
        setResultMsg(`Locked ${num(Math.round(n))} sats for ${lockYears} year${lockYears > 1 ? "s" : ""}.`);
      }

      setPhase("result");
      onDone?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)",
          zIndex: 400,
        }}
        onClick={onClose}
      />

      {/* Modal card */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        zIndex: 401, width: "min(420px, 94vw)",
        background: "var(--card-bg)",
        border: "1px solid var(--border-soft)",
        borderRadius: 16, padding: "24px 28px",
        boxShadow: "0 24px 64px rgba(0,0,0,.5)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
            {TITLES[kind]}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--soft)", fontSize: 20, lineHeight: 1 }}>
            <i className="ti ti-x" />
          </button>
        </div>

        {phase === "form" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Method toggle — deposit and withdraw */}
            {kind === "deposit" && (
              <div className="seg">
                <button className={method === "mpesa" ? "on" : ""} onClick={() => setMethod("mpesa")}>M-Pesa</button>
                <button className={method === "lightning" ? "on" : ""} onClick={() => setMethod("lightning")}>Lightning</button>
              </div>
            )}

            {/* Send fields */}
            {kind === "send" ? (
              <>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--soft)", marginBottom: 6 }}>
                    Lightning address or invoice
                  </label>
                  <input
                    type="text"
                    placeholder="you@wallet.com or lnbc…"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      padding: "10px 12px", borderRadius: 8,
                      border: "1px solid var(--border-soft)",
                      background: "transparent", color: "var(--fg)", fontSize: 14,
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--soft)", marginBottom: 6 }}>
                    Amount (sats)
                  </label>
                  <input
                    type="number" min="1" placeholder="10000"
                    value={sendSats}
                    onChange={(e) => setSendSats(e.target.value)}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      padding: "10px 12px", borderRadius: 8,
                      border: "1px solid var(--border-soft)",
                      background: "transparent", color: "var(--fg)", fontSize: 14,
                    }}
                  />
                </div>
              </>
            ) : kind === "lock" ? (
              <>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--soft)", marginBottom: 6 }}>
                    Amount (sats)
                  </label>
                  <input
                    type="number" min="1" placeholder="100000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      padding: "10px 12px", borderRadius: 8,
                      border: "1px solid var(--border-soft)",
                      background: "transparent", color: "var(--fg)", fontSize: 14,
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--soft)", marginBottom: 6 }}>
                    Lock duration
                  </label>
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
              /* deposit or withdraw */
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--soft)", marginBottom: 6 }}>
                  {amountLabel}
                </label>
                <input
                  type="number" min="1"
                  placeholder={kind === "deposit" && method === "mpesa" ? "500" : "10000"}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "10px 12px", borderRadius: 8,
                    border: "1px solid var(--border-soft)",
                    background: "transparent", color: "var(--fg)", fontSize: 14,
                  }}
                />
                {kind === "deposit" && method === "mpesa" && amount && parseFloat(amount) > 0 && (
                  <p style={{ fontSize: 11, color: "var(--soft)", marginTop: 5 }}>
                    ≈ {num(kesToSats(parseFloat(amount), rate))} sats
                  </p>
                )}
              </div>
            )}

            {error && (
              <p style={{
                fontSize: 12, color: "var(--red, #e03)",
                padding: "8px 12px", borderRadius: 8,
                background: "rgba(220,30,30,.1)",
              }}>
                {error}
              </p>
            )}

            <Button
              variant="primary"
              onClick={() => void handleSubmit()}
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading ? "Processing…" : `Confirm ${TITLES[kind]}`}
            </Button>
          </div>
        ) : (
          /* Result phase */
          <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", textAlign: "center" }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "rgba(17,166,91,.15)",
              display: "grid", placeItems: "center",
            }}>
              <i className="ti ti-circle-check" style={{ fontSize: 26, color: "var(--emerald-deep, #11a65b)" }} />
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6 }}>{resultMsg}</p>
            {invoice && (
              <div style={{
                background: "rgba(0,0,0,.2)", padding: "10px 14px",
                borderRadius: 8, wordBreak: "break-all",
                fontSize: 11, fontFamily: "var(--font-mono)", textAlign: "left",
                width: "100%", boxSizing: "border-box",
              }}>
                {invoice}
              </div>
            )}
            <Button variant="ghost" onClick={onClose} style={{ width: "100%" }}>Done</Button>
          </div>
        )}
      </div>
    </>
  );
}
