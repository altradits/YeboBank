"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

import { useRouter } from "next/navigation";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import LogoMark from "@/components/ui/LogoMark";

export type ProductType = "send" | "savings" | "mpesa" | "chama" | "lightning" | "agent" | "invest";

interface QuickProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: ProductType;
  initialAmount?: string;
}

const PROVIDERS_BY_COUNTRY: Record<
  "KE" | "ET" | "SO",
  { name: string; currency: string; flag: string; providers: string[]; defaultPhone: string }
> = {
  KE: {
    name: "Kenya",
    currency: "KES",
    flag: "🇰🇪",
    providers: ["M-Pesa", "Airtel Money"],
    defaultPhone: "0712 345 678",
  },
  ET: {
    name: "Ethiopia",
    currency: "ETB",
    flag: "🇪🇹",
    providers: ["Telebirr", "CBE Birr"],
    defaultPhone: "0911 234 567",
  },
  SO: {
    name: "Somalia",
    currency: "SOS",
    flag: "🇸🇴",
    providers: ["EVC Plus", "ZAAD", "Sahal"],
    defaultPhone: "0615 123 456",
  },
};

const META: Record<ProductType, { title: string; icon: string; buttonLabel: string; hint: string }> = {
  send: {
    title: "Direct Cross-Border Send",
    icon: "ti-send",
    buttonLabel: "Send Money Instantly",
    hint: "Instant zero-cost exchange medium across Kenya, Ethiopia & Somalia.",
  },
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
  const [senderPhone, setSenderPhone] = useState("0712 345 678");
  const [sendCountry, setSendCountry] = useState<"KE" | "ET" | "SO">("ET");
  const [recipientProvider, setRecipientProvider] = useState("Telebirr");
  const [sendRecipient, setSendRecipient] = useState("0911 234 567");
  const [sendAgreed, setSendAgreed] = useState(false);
  const [lockYears, setLockYears] = useState(1);
  const [chamaName, setChamaName] = useState("Umoja Savings Circle");
  const [lightningDest, setLightningDest] = useState("wanjiku@yebobank.com");
  const [satsAmount, setSatsAmount] = useState("10000");

  const [phase, setPhase] = useState<"input" | "processing" | "success">("input");
  const [statusMessage, setStatusMessage] = useState("");

  const handleSelectSendCountry = (country: "KE" | "ET" | "SO") => {
    setSendCountry(country);
    const countryData = PROVIDERS_BY_COUNTRY[country];
    setRecipientProvider(countryData.providers[0]);
    setSendRecipient(countryData.defaultPhone);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialProduct) setActiveTab(initialProduct);
      if (initialAmount) setKesAmount(initialAmount);
      setPhase("input");
      setStatusMessage("");
      setSendAgreed(false);
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
      if (activeTab === "send") {
        const destStr =
          sendCountry === "ET"
            ? `${num(Math.round(numKes * rate.kesEtb))} ETB`
            : sendCountry === "SO"
            ? `${num(Math.round(numKes * rate.kesSos))} SOS`
            : `KES ${num(numKes)}`;
        setStatusMessage(
          `STK Push sent to your M-Pesa line (${senderPhone}). Upon PIN entry, ${destStr} will be instantly credited to ${sendRecipient} via ${recipientProvider}. Zero exchange fee charged via YeboBank.`
        );
      } else if (activeTab === "savings") {
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
              {/* SEND (CROSS-BORDER DIRECT ZERO-FEE) */}
              {activeTab === "send" && (
                <>
                  {/* Sender Section - M-Pesa Debit Source */}
                  <div className="qa-field">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                      <label className="qa-lbl" style={{ margin: 0 }}>Sender M-Pesa Number (Debit Source)</label>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--emerald-deep)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <i className="ti ti-bolt" /> STK Push
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "115px 1fr", gap: 8 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          background: "var(--cream)",
                          borderRadius: 10,
                          border: "1px solid var(--border-soft)",
                          padding: "0 8px",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--text)",
                        }}
                      >
                        <span>🇰🇪</span>
                        <span>M-Pesa</span>
                      </div>
                      <input
                        type="tel"
                        className="input"
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        placeholder="Your M-Pesa (0712 345 678)"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Sending Amount (KES) */}
                  <div className="qa-field">
                    <label className="qa-lbl">Sending Amount (KES)</label>
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
                  </div>

                  {/* Recipient Section - Country & Mobile Money */}
                  <div className="qa-field">
                    <label className="qa-lbl">Recipient Destination &amp; Mobile Money</label>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 8,
                        background: "var(--cream)",
                        padding: 4,
                        borderRadius: 12,
                        border: "1px solid var(--border-soft)",
                        marginBottom: 10,
                      }}
                    >
                      {(["KE", "ET", "SO"] as const).map((code) => {
                        const c = PROVIDERS_BY_COUNTRY[code];
                        const isSelected = sendCountry === code;
                        return (
                          <button
                            key={code}
                            type="button"
                            onClick={() => handleSelectSendCountry(code)}
                            style={{
                              padding: "8px 4px",
                              fontSize: 12.5,
                              fontWeight: isSelected ? 700 : 500,
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
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 5,
                            }}
                          >
                            <span>{c.flag}</span>
                            <span>{c.name}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Mobile Money Provider Pills */}
                    <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Credit via:</span>
                      {PROVIDERS_BY_COUNTRY[sendCountry].providers.map((prov) => {
                        const isProvSelected = recipientProvider === prov;
                        return (
                          <button
                            key={prov}
                            type="button"
                            onClick={() => setRecipientProvider(prov)}
                            style={{
                              padding: "5px 12px",
                              borderRadius: 20,
                              border: isProvSelected ? "1.5px solid var(--emerald-deep)" : "1px solid var(--border-soft)",
                              background: isProvSelected ? "rgba(16, 138, 79, 0.12)" : "var(--cream)",
                              color: isProvSelected ? "var(--emerald-deep)" : "var(--muted)",
                              fontSize: 11.5,
                              fontWeight: isProvSelected ? 700 : 500,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {prov}
                          </button>
                        );
                      })}
                    </div>

                    {/* Recipient Phone Input */}
                    <input
                      type="tel"
                      className="input"
                      value={sendRecipient}
                      onChange={(e) => setSendRecipient(e.target.value)}
                      placeholder={`Recipient ${recipientProvider} Number (${PROVIDERS_BY_COUNTRY[sendCountry].defaultPhone})`}
                      required
                    />

                    {numKes > 0 && (
                      <div className="qa-hint" style={{ marginTop: 8 }}>
                        <span className="qa-hint-icon">
                          <i className="ti ti-arrows-exchange" />
                        </span>
                        <div className="qa-hint-content">
                          <span className="qa-hint-value">
                            Recipient gets ≈ {sendCountry === "ET" ? `${num(Math.round(numKes * rate.kesEtb))} ETB` : sendCountry === "SO" ? `${num(Math.round(numKes * rate.kesSos))} SOS` : `KES ${num(numKes)}`} ({recipientProvider})
                          </span>
                          <span className="qa-hint-sub">
                            · YeboBank zero-cost exchange medium (≈ {num(sats)} sats)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Anti-Scam Security Notice */}
                  <div className="qa-advisory">
                    <div className="qa-advisory-hd">
                      <i className="ti ti-shield-alert" />
                      <span>Direct Transfer &amp; Anti-Scam Advisory</span>
                    </div>
                    <ul className="qa-advisory-list">
                      <li className="qa-advisory-item">
                        <span className="qa-advisory-dot" />
                        <span><strong>No account required:</strong> Send money directly between Kenya, Ethiopia &amp; Somalia at 0% fee with YeboBank as medium.</span>
                      </li>
                      <li className="qa-advisory-item">
                        <span className="qa-advisory-dot" />
                        <span><strong>Only transact for yourself:</strong> If another person is guiding or directing you on what to do, <strong>STOP</strong>. They may be attempting to scam you of your money.</span>
                      </li>
                      <li className="qa-advisory-item">
                        <span className="qa-advisory-dot" />
                        <span><strong>Unsure of the caller?</strong> Seek advice from YeboBank before proceeding. You are solely responsible for this transaction.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Mandatory Agreement Checkbox */}
                  <label className="qa-agreement-label">
                    <input
                      type="checkbox"
                      className="qa-agreement-checkbox"
                      checked={sendAgreed}
                      onChange={(e) => setSendAgreed(e.target.checked)}
                      required
                    />
                    <span>
                      I am performing this transaction myself, I am not being directed by a third party, and I understand and accept full responsibility for this transfer.
                    </span>
                  </label>
                </>
              )}

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
              {(() => {
                const isSendDisabled =
                  activeTab === "send" &&
                  (!sendAgreed || numKes <= 0 || !senderPhone.trim() || !sendRecipient.trim());
                return (
                  <button
                    type="submit"
                    className="btn btn-gold"
                    disabled={isSendDisabled}
                    style={{
                      width: "100%",
                      padding: "14px",
                      fontWeight: 700,
                      fontSize: 15,
                      marginTop: 6,
                      borderRadius: 12,
                      boxShadow: !isSendDisabled
                        ? "0 4px 16px rgba(240, 204, 88, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.4)"
                        : "none",
                      opacity: isSendDisabled ? 0.45 : 1,
                      cursor: isSendDisabled ? "not-allowed" : "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {activeTab === "send"
                      ? `Debit M-Pesa & Send ${numKes > 0 ? `KES ${num(numKes)}` : ""}`
                      : currentMeta.buttonLabel}
                  </button>
                );
              })()}
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
                {activeTab === "send"
                  ? `Debiting M-Pesa (${senderPhone})…`
                  : `Processing ${currentMeta.title}…`}
              </h4>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
                {activeTab === "send"
                  ? `Routing zero-cost conversion to ${sendRecipient} (${recipientProvider}) over YeboBank rails`
                  : "Securing transaction on Bitcoin settlement rails"}
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


