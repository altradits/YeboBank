"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

import { useRouter } from "next/navigation";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import LogoMark from "@/components/ui/LogoMark";

export type ProductType = "savings" | "mpesa" | "chama" | "lightning" | "agent" | "invest";

interface QuickProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: ProductType;
  initialAmount?: string;
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
  initialAmount,
}: QuickProductModalProps) {
  const router = useRouter();
  const rate = useRate();
  const [mounted, setMounted] = useState(false);

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
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialProduct) setActiveTab(initialProduct);
      if (initialAmount) setKesAmount(initialAmount);
      setPhase("input");
      setStatusMessage("");
    }
  }, [isOpen, initialProduct, initialAmount]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

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

  return createPortal(
    <div className="qpm-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="qpm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Card Header with 3D Badge & Title */}
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
              <i className={`ti ${currentMeta.icon}`} />
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
                {currentMeta.title}
              </h3>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  margin: "2px 0 0",
                  lineHeight: 1.3,
                }}
              >
                {currentMeta.hint}
              </p>
            </div>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
            style={{ position: "static" }}
          >
            <i className="ti ti-x" />
          </button>
        </div>

        {/* Card Body */}
        <div style={{ padding: "20px 22px" }}>
          {phase === "input" && (
            <form onSubmit={handleInstantAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* SAVINGS */}
              {activeTab === "savings" && (
                <>
                  <div className="qa-field">
                    <label className="qa-lbl">Amount to Lock (KES)</label>
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
                        <span className="qa-hint-icon">
                          <i className="ti ti-lock" />
                        </span>
                        <div className="qa-hint-content">
                          <span className="qa-hint-value">≈ {num(sats)} sats</span>
                          <span className="qa-hint-sub">· 5.2% APY real yield</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="qa-field">
                    <label className="qa-lbl">Lock Duration</label>
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
                      {[1, 2, 3, 5].map((yrs) => {
                        const isSelected = lockYears === yrs;
                        return (
                          <button
                            key={yrs}
                            type="button"
                            onClick={() => setLockYears(yrs)}
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
                            {yrs} {yrs === 1 ? "yr" : "yrs"}
                          </button>
                        );
                      })}
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
                        <span className="qa-hint-icon">
                          <i className="ti ti-bolt" />
                        </span>
                        <div className="qa-hint-content">
                          <span className="qa-hint-value">≈ {num(sats)} sats</span>
                          <span className="qa-hint-sub">receives immediately</span>
                        </div>
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
                        <span className="qa-hint-icon">
                          <i className="ti ti-users" />
                        </span>
                        <div className="qa-hint-content">
                          <span className="qa-hint-value">≈ {num(sats)} sats</span>
                          <span className="qa-hint-sub">per cycle</span>
                        </div>
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
                    {Number(satsAmount) > 0 && (
                      <div className="qa-hint">
                        <span className="qa-hint-icon">
                          <i className="ti ti-arrows-exchange" />
                        </span>
                        <div className="qa-hint-content">
                          <span className="qa-hint-value">≈ KES {num(Math.round(Number(satsAmount) * rate.kesPerSat), 2)}</span>
                          <span className="qa-hint-sub">at market rate</span>
                        </div>
                      </div>
                    )}
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
                    {numKes > 0 && (
                      <div className="qa-hint">
                        <span className="qa-hint-icon">
                          <i className="ti ti-cash" />
                        </span>
                        <div className="qa-hint-content">
                          <span className="qa-hint-value">≈ {num(sats)} sats</span>
                          <span className="qa-hint-sub">cash deposit voucher</span>
                        </div>
                      </div>
                    )}
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
                        <span className="qa-hint-icon">
                          <i className="ti ti-trending-up" />
                        </span>
                        <div className="qa-hint-content">
                          <span className="qa-hint-value">≈ {num(sats)} sats</span>
                          <span className="qa-hint-sub">into productive real assets</span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* 3D Action Button */}
              <button
                type="submit"
                className="btn btn-gold"
                style={{
                  width: "100%",
                  padding: "14px",
                  fontWeight: 700,
                  fontSize: 15,
                  marginTop: 6,
                  borderRadius: 12,
                  boxShadow: "0 4px 16px rgba(240, 204, 88, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
                  cursor: "pointer",
                }}
              >
                {currentMeta.buttonLabel}
              </button>
            </form>
          )}

          {phase === "processing" && (
            <div style={{ textAlign: "center", padding: "34px 10px" }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  border: "3px solid var(--border-soft)",
                  borderTopColor: "var(--gold)",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 16px",
                }}
              />
              <h4 style={{ fontFamily: "var(--font-display)", fontSize: 17, margin: "0 0 6px" }}>
                Processing {currentMeta.title}…
              </h4>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
                Securing transaction on Bitcoin settlement rails
              </p>
            </div>
          )}

          {phase === "success" && (
            <div style={{ textAlign: "center", padding: "24px 10px" }}>
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
                <i className="ti ti-check" />
              </div>
              <h4 style={{ fontFamily: "var(--font-display)", fontSize: 19, margin: "0 0 6px" }}>Done</h4>
              <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "0 0 20px" }}>{statusMessage}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  className="btn btn-gold"
                  onClick={handleNavigateToApp}
                  style={{
                    width: "100%",
                    padding: "13px",
                    fontWeight: 700,
                    borderRadius: 12,
                    boxShadow: "0 4px 14px rgba(240, 204, 88, 0.3)",
                  }}
                >
                  Open Member Dashboard →
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => setPhase("input")}
                  style={{ width: "100%", padding: "11px", borderRadius: 12 }}
                >
                  New Transaction
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}


