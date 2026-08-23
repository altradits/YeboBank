"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import LogoMark from "@/components/ui/LogoMark";

export type ProductType = "savings" | "mpesa" | "chama" | "lightning" | "agent" | "invest";

interface QuickProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: ProductType;
}

const META: Record<ProductType, { title: string; icon: string; buttonLabel: string; hint: string }> = {
  savings: {
    title: "Lock Savings in Sats",
    icon: "ti-lock",
    buttonLabel: "Save",
    hint: "Earns ~5.2% APY real yield in Bitcoin.",
  },
  mpesa: {
    title: "M-Pesa Deposit",
    icon: "ti-device-mobile",
    buttonLabel: "Deposit",
    hint: "Instant STK push to your Safaricom line.",
  },
  chama: {
    title: "Join Chama Circle",
    icon: "ti-users",
    buttonLabel: "Join Chama",
    hint: "Group savings pool protected by multisig.",
  },
  lightning: {
    title: "Send via Lightning",
    icon: "ti-bolt",
    buttonLabel: "Send",
    hint: "Instant sub-second global Bitcoin transfer.",
  },
  agent: {
    title: "Cash In at Agent",
    icon: "ti-cash",
    buttonLabel: "Cash In",
    hint: "Generate instant cash-in voucher code.",
  },
  invest: {
    title: "Request Fund Allocation",
    icon: "ti-trending-up",
    buttonLabel: "Request Allocation",
    hint: "Stewarded wealth management pool.",
  },
};

export default function QuickProductModal({
  isOpen,
  onClose,
  initialProduct = "savings",
}: QuickProductModalProps) {
  const router = useRouter();
  const rate = useRate();

  const [activeTab, setActiveTab] = useState<ProductType>(initialProduct);
  const [kesAmount, setKesAmount] = useState("1000");
  const [phone, setPhone] = useState("0712 345 678");
  const [lockYears, setLockYears] = useState(1);
  const [chamaName, setChamaName] = useState("Umoja Savings Circle");
  const [lightningDest, setLightningDest] = useState("wanjiku@yebobank.com");
  const [satsAmount, setSatsAmount] = useState("10000");

  const [phase, setPhase] = useState<"input" | "processing" | "success">("input");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (initialProduct) {
      setActiveTab(initialProduct);
    }
  }, [initialProduct]);

  useEffect(() => {
    if (!isOpen) {
      setPhase("input");
      setStatusMessage("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentMeta = META[activeTab] || META.savings;
  const numKes = parseFloat(kesAmount.replace(/[^0-9.]/g, "")) || 0;
  const sats = Math.round(numKes * rate.satsPerKes);

  const handleInstantAction = (e: React.FormEvent) => {
    e.preventDefault();
    setPhase("processing");

    setTimeout(() => {
      setPhase("success");
      if (activeTab === "savings") {
        setStatusMessage(`Successfully locked ${num(sats)} sats at 5.2% APY.`);
      } else if (activeTab === "mpesa") {
        setStatusMessage(`STK Push of KES ${num(numKes)} sent to ${phone}. Enter your M-Pesa PIN.`);
      } else if (activeTab === "chama") {
        setStatusMessage(`Pledge of KES ${num(numKes)} submitted to "${chamaName}".`);
      } else if (activeTab === "lightning") {
        setStatusMessage(`Payment sent to ${lightningDest}.`);
      } else if (activeTab === "agent") {
        setStatusMessage(`Voucher code #YB-8492 generated for cash deposit of KES ${num(numKes)}.`);
      } else {
        setStatusMessage(`Allocation request for KES ${num(numKes)} submitted to Mlinzi steward.`);
      }
    }, 700);
  };

  const handleNavigateToApp = () => {
    onClose();
    router.push(`/login?redirect=/${activeTab === "invest" ? "invest" : activeTab === "agent" ? "agent" : "dashboard"}`);
  };

  return (
    <div className="qpm-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="qpm-modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="qpm-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-soft)" }}>
          <div className="qpm-brand" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18, color: "var(--gold-text)" }}>
              <i className={`ti ${currentMeta.icon}`} />
            </span>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>
              {currentMeta.title}
            </span>
          </div>
          <button className="qpm-close" onClick={onClose} aria-label="Close modal">
            <i className="ti ti-x" />
          </button>
        </div>

        {/* Content area */}
        <div className="qpm-body" style={{ padding: "20px" }}>
          {phase === "input" && (
            <form onSubmit={handleInstantAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* SAVINGS */}
              {activeTab === "savings" && (
                <>
                  <div className="qa-field">
                    <label className="qa-lbl">Amount (KES)</label>
                    <div className="qa-amount-wrap">
                      <span className="qa-amount-pfx">KES</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="qa-amount-input qa-amount-input--kes"
                        value={kesAmount}
                        onChange={(e) => setKesAmount(e.target.value)}
                        placeholder="1,000"
                        required
                        autoFocus
                      />
                    </div>
                    {numKes > 0 && (
                      <div className="qa-hint">
                        <i className="ti ti-lock" /> ≈ {num(sats)} sats · 5.2% APY real yield
                      </div>
                    )}
                  </div>

                  <div className="qa-field">
                    <label className="qa-lbl">Lock Duration</label>
                    <div className="seg">
                      {[1, 2, 3, 5].map((yrs) => (
                        <button
                          key={yrs}
                          type="button"
                          className={lockYears === yrs ? "on" : ""}
                          onClick={() => setLockYears(yrs)}
                        >
                          {yrs} {yrs === 1 ? "yr" : "yrs"}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* M-PESA DEPOSIT */}
              {activeTab === "mpesa" && (
                <>
                  <div className="qa-field">
                    <label className="qa-lbl">Deposit Amount (KES)</label>
                    <div className="qa-amount-wrap">
                      <span className="qa-amount-pfx">KES</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="qa-amount-input qa-amount-input--kes"
                        value={kesAmount}
                        onChange={(e) => setKesAmount(e.target.value)}
                        placeholder="500"
                        required
                        autoFocus
                      />
                    </div>
                    {numKes > 0 && (
                      <div className="qa-hint">
                        <i className="ti ti-bolt" /> Receives ≈ {num(sats)} sats immediately
                      </div>
                    )}
                  </div>

                  <div className="qa-field">
                    <label className="qa-lbl">Safaricom Phone Number</label>
                    <input
                      type="tel"
                      className="input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0712 345 678"
                      required
                    />
                  </div>
                </>
              )}

              {/* CHAMA */}
              {activeTab === "chama" && (
                <>
                  <div className="qa-field">
                    <label className="qa-lbl">Chama Name or Invite Code</label>
                    <input
                      type="text"
                      className="input"
                      value={chamaName}
                      onChange={(e) => setChamaName(e.target.value)}
                      placeholder="Umoja Savings Circle"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="qa-field">
                    <label className="qa-lbl">Monthly Share (KES)</label>
                    <div className="qa-amount-wrap">
                      <span className="qa-amount-pfx">KES</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="qa-amount-input qa-amount-input--kes"
                        value={kesAmount}
                        onChange={(e) => setKesAmount(e.target.value)}
                        placeholder="1,000"
                        required
                      />
                    </div>
                    {numKes > 0 && (
                      <div className="qa-hint">
                        <i className="ti ti-users" /> ≈ {num(sats)} sats per cycle
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* LIGHTNING */}
              {activeTab === "lightning" && (
                <>
                  <div className="qa-field">
                    <label className="qa-lbl">Recipient Address / Invoice</label>
                    <input
                      type="text"
                      className="input"
                      value={lightningDest}
                      onChange={(e) => setLightningDest(e.target.value)}
                      placeholder="user@yebobank.com"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="qa-field">
                    <label className="qa-lbl">Amount (Sats)</label>
                    <div className="qa-amount-wrap">
                      <input
                        type="number"
                        className="qa-amount-input"
                        value={satsAmount}
                        onChange={(e) => setSatsAmount(e.target.value)}
                        placeholder="10,000"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* AGENT */}
              {activeTab === "agent" && (
                <>
                  <div className="qa-field">
                    <label className="qa-lbl">Cash Amount to Deposit (KES)</label>
                    <div className="qa-amount-wrap">
                      <span className="qa-amount-pfx">KES</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="qa-amount-input qa-amount-input--kes"
                        value={kesAmount}
                        onChange={(e) => setKesAmount(e.target.value)}
                        placeholder="2,000"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="qa-field">
                    <label className="qa-lbl">Your Phone Number</label>
                    <input
                      type="tel"
                      className="input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0712 345 678"
                      required
                    />
                  </div>
                </>
              )}

              {/* INVEST */}
              {activeTab === "invest" && (
                <>
                  <div className="qa-field">
                    <label className="qa-lbl">Allocation Amount (KES)</label>
                    <div className="qa-amount-wrap">
                      <span className="qa-amount-pfx">KES</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="qa-amount-input qa-amount-input--kes"
                        value={kesAmount}
                        onChange={(e) => setKesAmount(e.target.value)}
                        placeholder="50,000"
                        required
                        autoFocus
                      />
                    </div>
                    {numKes > 0 && (
                      <div className="qa-hint">
                        <i className="ti ti-trending-up" /> ≈ {num(sats)} sats into productive real assets
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Single Goal Action Button */}
              <button
                type="submit"
                className="btn btn-gold"
                style={{
                  width: "100%",
                  padding: "13px",
                  fontWeight: 700,
                  fontSize: 15,
                  marginTop: 6,
                }}
              >
                {currentMeta.buttonLabel}
              </button>
            </form>
          )}

          {phase === "processing" && (
            <div style={{ textAlign: "center", padding: "30px 10px" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  border: "3px solid var(--border)",
                  borderTopColor: "var(--gold)",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 14px",
                }}
              />
              <h4 style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>Processing {currentMeta.title}…</h4>
            </div>
          )}

          {phase === "success" && (
            <div style={{ textAlign: "center", padding: "20px 10px" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "rgba(28, 180, 96, 0.15)",
                  color: "var(--emerald-deep)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 24,
                  margin: "0 auto 12px",
                }}
              >
                <i className="ti ti-check" />
              </div>
              <h4 style={{ fontFamily: "var(--font-display)", fontSize: 18, marginBottom: 6 }}>Done</h4>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18 }}>{statusMessage}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button className="btn btn-gold" onClick={handleNavigateToApp} style={{ width: "100%" }}>
                  Open Member Dashboard →
                </button>
                <button className="btn btn-ghost" onClick={() => setPhase("input")} style={{ width: "100%" }}>
                  New Transaction
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
