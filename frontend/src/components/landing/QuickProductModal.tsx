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

interface ProductTabMeta {
  id: ProductType;
  label: string;
  badge: string;
  icon: string;
  headline: string;
  tagline: string;
  accentClass: string;
}

const PRODUCTS: ProductTabMeta[] = [
  {
    id: "savings",
    label: "Savings Vault",
    badge: "5.2% APY",
    icon: "ti-lock",
    headline: "Lock Savings in Sats. Beat Inflation.",
    tagline: "Your capital compounds in Bitcoin with ~5.2% real yield. Zero lock-in penalty on maturity.",
    accentClass: "gold",
  },
  {
    id: "mpesa",
    label: "M-Pesa Deposit",
    badge: "Instant 0%",
    icon: "ti-device-mobile",
    headline: "Deposit via M-Pesa in 15 Seconds.",
    tagline: "Direct Safaricom STK Push to your phone. Turn spare shillings into hard satoshis instantly.",
    accentClass: "lime",
  },
  {
    id: "chama",
    label: "Chama Circle",
    badge: "Group Yield",
    icon: "ti-users",
    headline: "Pool Capital with Your Chama.",
    tagline: "Transparent multisig vaults for merry-go-rounds, investment clubs, and family pools.",
    accentClass: "emerald",
  },
  {
    id: "lightning",
    label: "Lightning Pay",
    badge: "< 3s Global",
    icon: "ti-bolt",
    headline: "Instant Global Bitcoin Transfers.",
    tagline: "Pay anyone worldwide for pennies. Human-readable address (e.g. name@yebobank.com).",
    accentClass: "gold",
  },
  {
    id: "agent",
    label: "Local Agent",
    badge: "47 Counties",
    icon: "ti-cash",
    headline: "Cash In & Out Down the Street.",
    tagline: "Deposit physical paper shillings at your local duka agent. No smartphone required.",
    accentClass: "lime",
  },
  {
    id: "invest",
    label: "Mlinzi Fund",
    badge: "F&F Pilot",
    icon: "ti-trending-up",
    headline: "Stewarded Wealth Management.",
    tagline: "Private pool of productive real-world assets. Compounded monthly with transparent ledger.",
    accentClass: "cyan",
  },
];

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

  const currentMeta = PRODUCTS.find((p) => p.id === activeTab) || PRODUCTS[0];
  const numKes = parseFloat(kesAmount.replace(/[^0-9.]/g, "")) || 0;
  const sats = Math.round(numKes * rate.satsPerKes);
  const projectedApyGainSats = Math.round(sats * 0.052 * lockYears);
  const projectedTotalSats = sats + projectedApyGainSats;

  const handleInstantAction = (e: React.FormEvent) => {
    e.preventDefault();
    setPhase("processing");

    setTimeout(() => {
      setPhase("success");
      if (activeTab === "savings") {
        setStatusMessage(`Locked ${num(sats)} sats for ${lockYears} year${lockYears > 1 ? "s" : ""} at 5.2% APY!`);
      } else if (activeTab === "mpesa") {
        setStatusMessage(`STK Push of KES ${num(numKes)} sent to ${phone}. Enter PIN to confirm.`);
      } else if (activeTab === "chama") {
        setStatusMessage(`Joined "${chamaName}" with ${num(sats)} sats initial pledge.`);
      } else if (activeTab === "lightning") {
        setStatusMessage(`Lightning payment of ${num(sats)} sats settled in 1.2s.`);
      } else if (activeTab === "agent") {
        setStatusMessage(`Cash-in code generated: #YB-7842. Show this to your local duka.`);
      } else {
        setStatusMessage(`Investor application for KES ${num(numKes)} submitted to Mlinzi steward.`);
      }
    }, 1200);
  };

  const handleNavigateToApp = () => {
    onClose();
    router.push(`/login?redirect=/${activeTab === "invest" ? "invest" : activeTab === "agent" ? "agent" : "dashboard"}`);
  };

  return (
    <div className="qpm-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="qpm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header with Mark and Close button */}
        <div className="qpm-header">
          <div className="qpm-brand">
            <LogoMark size={28} />
            <span className="qpm-title">1-Click Product Launcher</span>
          </div>
          <button className="qpm-close" onClick={onClose} aria-label="Close modal">
            <i className="ti ti-x" />
          </button>
        </div>

        {/* Product selector tabs */}
        <div className="qpm-tabs" role="tablist">
          {PRODUCTS.map((prod) => (
            <button
              key={prod.id}
              role="tab"
              aria-selected={activeTab === prod.id}
              className={`qpm-tab ${activeTab === prod.id ? "active" : ""}`}
              onClick={() => {
                setActiveTab(prod.id);
                setPhase("input");
              }}
            >
              <i className={`ti ${prod.icon}`} />
              <span className="qpm-tab-label">{prod.label}</span>
              <span className="qpm-tab-badge">{prod.badge}</span>
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="qpm-body">
          <div className="qpm-lead-box">
            <h3 className="qpm-headline">
              <i className={`ti ${currentMeta.icon} qpm-lead-icon`} /> {currentMeta.headline}
            </h3>
            <p className="qpm-tagline">{currentMeta.tagline}</p>
          </div>

          {phase === "input" && (
            <form onSubmit={handleInstantAction} className="qpm-form">
              {/* Product specific interactive controls */}
              {activeTab === "savings" && (
                <div className="qpm-section">
                  <label className="qpm-label">Amount to Lock (KES)</label>
                  <div className="qpm-input-row">
                    <span className="qpm-currency-tag">KES</span>
                    <input
                      type="text"
                      className="qpm-input"
                      value={kesAmount}
                      onChange={(e) => setKesAmount(e.target.value)}
                      placeholder="e.g. 5,000"
                      required
                    />
                  </div>
                  <div className="qpm-conversion-preview">
                    <span className="qpm-sat-value">⚡ {num(sats)} sats</span>
                    <span className="qpm-rate-hint">Live market rate: 1 BTC = KES {num(rate.btcKes)}</span>
                  </div>

                  <div className="qpm-row-group">
                    <label className="qpm-label">Lock Duration</label>
                    <div className="qpm-seg-group">
                      {[1, 2, 3, 5].map((yrs) => (
                        <button
                          key={yrs}
                          type="button"
                          className={`qpm-seg-btn ${lockYears === yrs ? "active" : ""}`}
                          onClick={() => setLockYears(yrs)}
                        >
                          {yrs} {yrs === 1 ? "Year" : "Years"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Growth card preview */}
                  <div className="qpm-projection-card">
                    <div className="qpm-proj-item">
                      <span className="qpm-proj-label">Principal</span>
                      <span className="qpm-proj-num">{num(sats)} sats</span>
                    </div>
                    <div className="qpm-proj-plus">+</div>
                    <div className="qpm-proj-item">
                      <span className="qpm-proj-label">5.2% APY Yield</span>
                      <span className="qpm-proj-num green">+{num(projectedApyGainSats)} sats</span>
                    </div>
                    <div className="qpm-proj-eq">=</div>
                    <div className="qpm-proj-item">
                      <span className="qpm-proj-label">Projected Total</span>
                      <span className="qpm-proj-num gold">{num(projectedTotalSats)} sats</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "mpesa" && (
                <div className="qpm-section">
                  <div className="qpm-row-two">
                    <div>
                      <label className="qpm-label">M-Pesa Mobile Number</label>
                      <input
                        type="tel"
                        className="qpm-input"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="07XX XXX XXX"
                        required
                      />
                    </div>
                    <div>
                      <label className="qpm-label">Deposit Amount (KES)</label>
                      <input
                        type="text"
                        className="qpm-input"
                        value={kesAmount}
                        onChange={(e) => setKesAmount(e.target.value)}
                        placeholder="500"
                        required
                      />
                    </div>
                  </div>
                  <div className="qpm-conversion-preview">
                    <span className="qpm-sat-value">⚡ Receives ~{num(sats)} sats</span>
                    <span className="qpm-tag-pill green">0% Safaricom Fee</span>
                  </div>
                </div>
              )}

              {activeTab === "chama" && (
                <div className="qpm-section">
                  <label className="qpm-label">Chama Name or Code</label>
                  <input
                    type="text"
                    className="qpm-input"
                    value={chamaName}
                    onChange={(e) => setChamaName(e.target.value)}
                    placeholder="e.g. Nairobi Traders Chama"
                    required
                  />
                  <div style={{ marginTop: 12 }}>
                    <label className="qpm-label">Monthly Share Pledge (KES)</label>
                    <input
                      type="text"
                      className="qpm-input"
                      value={kesAmount}
                      onChange={(e) => setKesAmount(e.target.value)}
                      placeholder="1,000"
                      required
                    />
                  </div>
                  <div className="qpm-conversion-preview">
                    <span className="qpm-sat-value">⚡ {num(sats)} sats / month</span>
                    <span className="qpm-tag-pill gold">Multisig Protection</span>
                  </div>
                </div>
              )}

              {activeTab === "lightning" && (
                <div className="qpm-section">
                  <label className="qpm-label">Recipient Lightning Address / Invoice</label>
                  <input
                    type="text"
                    className="qpm-input"
                    value={lightningDest}
                    onChange={(e) => setLightningDest(e.target.value)}
                    placeholder="username@yebobank.com or lnbc..."
                    required
                  />
                  <div style={{ marginTop: 12 }}>
                    <label className="qpm-label">Amount in Satoshis</label>
                    <input
                      type="number"
                      className="qpm-input"
                      value={sats}
                      onChange={(e) => {
                        const s = parseFloat(e.target.value) || 0;
                        setKesAmount(String(Math.round(s * rate.kesPerSat)));
                      }}
                      placeholder="10000"
                      required
                    />
                  </div>
                  <div className="qpm-conversion-preview">
                    <span className="qpm-sat-value">≈ KES {num(sats * rate.kesPerSat, 2)}</span>
                    <span className="qpm-tag-pill cyan">Sub-second Speed</span>
                  </div>
                </div>
              )}

              {activeTab === "agent" && (
                <div className="qpm-section">
                  <label className="qpm-label">Your Phone Number</label>
                  <input
                    type="tel"
                    className="qpm-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07XX XXX XXX"
                    required
                  />
                  <div style={{ marginTop: 12 }}>
                    <label className="qpm-label">Cash Deposit Amount (KES)</label>
                    <input
                      type="text"
                      className="qpm-input"
                      value={kesAmount}
                      onChange={(e) => setKesAmount(e.target.value)}
                      placeholder="2,000"
                      required
                    />
                  </div>
                  <div className="qpm-conversion-preview">
                    <span className="qpm-sat-value">⚡ Agent loads ~{num(sats)} sats</span>
                    <span className="qpm-tag-pill lime">47 Counties Live</span>
                  </div>
                </div>
              )}

              {activeTab === "invest" && (
                <div className="qpm-section">
                  <label className="qpm-label">Capital to Deploy (KES)</label>
                  <input
                    type="text"
                    className="qpm-input"
                    value={kesAmount}
                    onChange={(e) => setKesAmount(e.target.value)}
                    placeholder="50,000"
                    required
                  />
                  <div className="qpm-conversion-preview">
                    <span className="qpm-sat-value">⚡ {num(sats)} sats in private pool</span>
                    <span className="qpm-tag-pill gold">+20% p.a. Target Return</span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--soft)", marginTop: 8 }}>
                    Friends &amp; Family pilot. Stewarded directly by Mlinzi with monthly verifiable statements.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="qpm-actions">
                <button type="submit" className="qpm-btn-primary">
                  <span>⚡ 1-Click Launch ({currentMeta.label})</span>
                </button>
                <button
                  type="button"
                  className="qpm-btn-secondary"
                  onClick={handleNavigateToApp}
                >
                  <span>Sign In &amp; Open Account →</span>
                </button>
              </div>
            </form>
          )}

          {phase === "processing" && (
            <div className="qpm-feedback-state">
              <div className="qpm-spinner" />
              <h4>Connecting to {currentMeta.label} Rails…</h4>
              <p>Executing zero-latency transaction on Kenyan Lightning rails.</p>
            </div>
          )}

          {phase === "success" && (
            <div className="qpm-feedback-state success">
              <div className="qpm-check-circle">
                <i className="ti ti-check" />
              </div>
              <h4>Order Initialized!</h4>
              <p className="qpm-success-msg">{statusMessage}</p>
              <div className="qpm-actions" style={{ marginTop: 24 }}>
                <button className="qpm-btn-primary" onClick={handleNavigateToApp}>
                  Go to Live Dashboard →
                </button>
                <button className="qpm-btn-secondary" onClick={() => setPhase("input")}>
                  Perform Another Action
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer guarantee */}
        <div className="qpm-footer">
          <span>🔒 Open Source · Bitcoin Savings Bank · Non-Custodial Options</span>
        </div>
      </div>
    </div>
  );
}
