"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  const [unit, setUnit] = useState<"KES" | "sats">("KES");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const sats =
    unit === "KES"
      ? kesToSats(parseFloat(amount) || 0, rate)
      : Math.round(parseFloat(amount) || 0);

  const lockTitle = lock.title ?? (lock.kind === "individual" ? "your lock" : lock.id);
  const currentAmount = unit === "KES" ? (parseFloat(amount) || 0) : sats;

  if (!mounted) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Header with 3D tactile icon badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 22px",
            margin: "-28px -28px 20px -28px",
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
              <i className="ti ti-lock" />
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
                Contribute to {lockTitle}
              </h3>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  margin: "2px 0 0",
                  lineHeight: 1.3,
                }}
              >
                Add funds to your savings vault
              </p>
            </div>
          </div>
          <button
            className="modal-close"
            onClick={onCancel}
            aria-label="Close"
            style={{ position: "static" }}
          >
            <i className="ti ti-x" />
          </button>
        </div>

        <div className="seg" style={{ marginBottom: 16 }}>
          <button className={unit === "KES" ? "on" : ""} onClick={() => setUnit("KES")}>KES</button>
          <button className={unit === "sats" ? "on" : ""} onClick={() => setUnit("sats")}>sats</button>
        </div>

        <div className="qa-field" style={{ marginBottom: 12 }}>
          <label className="qa-lbl">Amount ({unit})</label>
          <div className="qa-amount-wrap">
            {unit === "KES" && <span className="qa-amount-pfx">KES</span>}
            <input
              className={`qa-amount-input ${unit === "KES" ? "qa-amount-input--kes" : ""}`}
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1,000"
              autoFocus
            />
          </div>
        </div>

        {amount !== "" && (
          <div className="qa-hint" style={{ marginBottom: 16 }}>
            <div className="qa-hint-content">
              <span className="qa-hint-label">Group pot receives:</span>
              <span className="qa-hint-value">
                {unit === "KES"
                  ? `${num(sats)} sats`
                  : `KES ${num(Math.round(sats * rate.kesPerSat))}`}
              </span>
              <span className="qa-hint-sub">
                {unit === "KES" ? "at market rate" : "equivalent"}
              </span>
            </div>
          </div>
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
          <div style={{ marginTop: 14 }}>
            <Button
              disabled
              block
              style={{
                borderRadius: 12,
                padding: "13px",
                fontWeight: 700,
              }}
            >
              Enter Amount
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}


