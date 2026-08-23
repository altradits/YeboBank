"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { useRate } from "@/lib/rate-context";
import { num, kesToSats } from "@/lib/format";
import SecurityTransactionGuard from "@/components/ui/SecurityTransactionGuard";
import type { SavingsLock } from "@/types";

interface Props {
  lock: SavingsLock;
  onConfirm: (sats: number) => void;
  onCancel: () => void;
  loading: boolean;
}

export default function ContributeModal({ lock, onConfirm, onCancel, loading }: Props) {
  const rate = useRate();
  const [unit, setUnit] = useState<"KES" | "sats">("KES");
  const [amount, setAmount] = useState("");

  const sats =
    unit === "KES"
      ? kesToSats(parseFloat(amount) || 0, rate)
      : Math.round(parseFloat(amount) || 0);

  const lockTitle = lock.title ?? (lock.kind === "individual" ? "your lock" : lock.id);
  const currentAmount = unit === "KES" ? (parseFloat(amount) || 0) : sats;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 440 }} role="dialog" aria-modal="true" aria-labelledby="contrib-lock-title" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onCancel} aria-label="Close">✕</button>

        <h2 id="contrib-lock-title">Contribute to {lockTitle}</h2>
        <p className="modal-sub">Add funds to your savings lock.</p>

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
              ? `≈ ${num(sats)} sats at market rate`
              : `≈ KES ${num(Math.round(sats * rate.kesPerSat))}`}
          </p>
        )}

        {/* RULES 1, 2, 3, 5: Security Guard with Timeout, OTP, Words Confirmation & Service Fee */}
        {sats > 0 ? (
          <SecurityTransactionGuard
            amount={currentAmount}
            currencyName={unit}
            onConfirm={() => onConfirm(sats)}
            onClose={onCancel}
            confirmLabel="Contribute"
            loading={loading}
          />
        ) : (
          <div className="modal-actions" style={{ marginTop: 14 }}>
            <Button disabled block>
              Enter Amount
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

