"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { useRate } from "@/lib/rate-context";
import { num, kesToSats } from "@/lib/format";
import type { SavingsLock } from "@/types";

interface Props {
  lock: SavingsLock;
  onConfirm: (sats: number) => void;
  onCancel: () => void;
  loading: boolean;
}

export default function ContributeModal({ lock, onConfirm, onCancel, loading }: Props) {
  const rate = useRate();
  const [step, setStep] = useState<"amount" | "pin">("amount");
  const [unit, setUnit] = useState<"KES" | "sats">("KES");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  const sats =
    unit === "KES"
      ? kesToSats(parseFloat(amount) || 0, rate)
      : Math.round(parseFloat(amount) || 0);

  const lockTitle = lock.title ?? (lock.kind === "individual" ? "your lock" : lock.id);

  function handleNext() {
    if (sats <= 0) return;
    setStep("pin");
  }

  function handleConfirm() {
    if (pin.length < 6) { setPinError("Enter your full 6-digit PIN."); return; }
    onConfirm(sats);
  }

  return (
    <div className="modal-overlay">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="contrib-lock-title">
        <button className="modal-close" onClick={onCancel} aria-label="Close">✕</button>

        {step === "amount" ? (
          <>
            <h2 id="contrib-lock-title">Add contribution</h2>
            <p className="modal-sub">Contributing to {lockTitle}.</p>

            <div className="seg" style={{ marginBottom: 14 }}>
              <button className={unit === "KES" ? "on" : ""} onClick={() => setUnit("KES")}>KES</button>
              <button className={unit === "sats" ? "on" : ""} onClick={() => setUnit("sats")}>sats</button>
            </div>

            <div className="field-group" style={{ marginBottom: 8 }}>
              <label>Amount ({unit})</label>
              <input
                className="input"
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
            {amount !== "" && (
              <p className="note" style={{ marginBottom: 14 }}>
                {unit === "KES"
                  ? `≈ ${num(sats)} sats`
                  : `≈ KES ${num(Math.round(sats * rate.kesPerSat))}`}
              </p>
            )}

            <div className="modal-actions">
              <Button onClick={handleNext} disabled={sats <= 0}>Next</Button>
              <Button variant="ghost" onClick={onCancel}>Cancel</Button>
            </div>
          </>
        ) : (
          <>
            <h2 id="contrib-lock-title">Confirm with PIN</h2>
            <p className="modal-sub">
              Contributing {num(sats)} sats
              {unit === "KES" && ` (≈ KES ${num(Math.round(sats * rate.kesPerSat))})`} to {lockTitle}.
            </p>

            <div className="field-group" style={{ marginBottom: 8 }}>
              <label>6-digit PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                className="input"
                placeholder="••••••"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setPinError("");
                }}
                autoFocus
              />
            </div>
            {pinError && <p style={{ color: "var(--red)", fontSize: 13, marginTop: 4 }}>{pinError}</p>}

            <div className="modal-actions">
              <Button onClick={handleConfirm} disabled={loading || pin.length < 6}>
                {loading ? "Processing…" : `Contribute ${num(sats)} sats`}
              </Button>
              <Button variant="ghost" onClick={() => { setStep("amount"); setPin(""); setPinError(""); }}>
                Back
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
