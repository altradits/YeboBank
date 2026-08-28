"use client";

import { useState } from "react";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import QuickProductModal from "./QuickProductModal";

type SourceUnit = "kes" | "etb" | "sos" | "sats" | "btc";

const UNITS: { id: SourceUnit; label: string; flag: string; symbol: string }[] = [
  { id: "kes", label: "KES", flag: "🇰🇪", symbol: "KES" },
  { id: "etb", label: "ETB", flag: "🇪🇹", symbol: "ETB" },
  { id: "sos", label: "SOS", flag: "🇸🇴", symbol: "SOS" },
  { id: "sats", label: "SATS", flag: "⚡", symbol: "sats" },
  { id: "btc", label: "BTC", flag: "₿", symbol: "BTC" },
];

export default function Converter() {
  const rate = useRate();
  const [unit, setUnit] = useState<SourceUnit>("kes");
  const [raw, setRaw] = useState("1,000");
  const [quickOpen, setQuickOpen] = useState(false);

  const value = parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;

  // Derive satoshis from chosen input unit
  let sats = 0;
  if (unit === "kes") sats = value * rate.satsPerKes;
  else if (unit === "etb") sats = value * rate.satsPerEtb;
  else if (unit === "sos") sats = (value / rate.kesSos) * rate.satsPerKes;
  else if (unit === "sats") sats = value;
  else if (unit === "btc") sats = value * 1e8;

  // Derive all target currency values
  const kesVal = sats * rate.kesPerSat;
  const etbVal = sats * rate.etbPerSat;
  const sosVal = kesVal * rate.kesSos;
  const satsVal = Math.round(sats);

  return (
    <section className="sec converter-section" id="convert">
      <div className="wrap converter-wrap">
        <div className="reveal converter-header">
          <h2 className="converter-title">
            Instant <span className="gold">Exchange.</span>
          </h2>
          <p className="converter-sub">
            Real-time conversion rates across Kenya, Ethiopia, Somalia, and Bitcoin.
          </p>
        </div>

        <div className="converter-card reveal d1">
          {/* Input Row */}
          <div className="converter-input-box">
            <div className="converter-input-label">
              <span>You Convert</span>
              <span style={{ fontSize: 11, color: "var(--emerald-deep)", fontWeight: 700 }}>
                Live Market Rate
              </span>
            </div>

            <div className="converter-input-wrap">
              <input
                type="text"
                inputMode="decimal"
                className="converter-input"
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder="1,000"
                aria-label="Amount to convert"
              />
              <div className="converter-unit-select" role="tablist" aria-label="Input currency">
                {UNITS.map((u) => {
                  const isSelected = unit === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      className={`converter-unit-btn ${isSelected ? "active" : ""}`}
                      onClick={() => setUnit(u.id)}
                    >
                      <span>{u.flag}</span>
                      <span>{u.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4 Clean Result Cards */}
          <div className="converter-grid">
            {/* Kenya */}
            <div className={`converter-result-card ${unit === "kes" ? "active-source" : ""}`}>
              <div className="converter-result-hd">
                <span className="converter-result-flag">
                  <span>🇰🇪</span> Kenya
                </span>
                <span className="converter-result-prov">M-Pesa</span>
              </div>
              <div className="converter-result-val">
                KES {num(kesVal, kesVal >= 100 ? 0 : 2)}
              </div>
            </div>

            {/* Ethiopia */}
            <div className={`converter-result-card ${unit === "etb" ? "active-source" : ""}`}>
              <div className="converter-result-hd">
                <span className="converter-result-flag">
                  <span>🇪🇹</span> Ethiopia
                </span>
                <span className="converter-result-prov">Telebirr</span>
              </div>
              <div className="converter-result-val">
                {num(etbVal, etbVal >= 100 ? 0 : 2)} ETB
              </div>
            </div>

            {/* Somalia */}
            <div className={`converter-result-card ${unit === "sos" ? "active-source" : ""}`}>
              <div className="converter-result-hd">
                <span className="converter-result-flag">
                  <span>🇸🇴</span> Somalia
                </span>
                <span className="converter-result-prov">EVC Plus</span>
              </div>
              <div className="converter-result-val">
                {num(Math.round(sosVal))} SOS
              </div>
            </div>

            {/* Bitcoin Sats */}
            <div className={`converter-result-card highlight ${unit === "sats" ? "active-source" : ""}`}>
              <div className="converter-result-hd">
                <span className="converter-result-flag">
                  <span>⚡</span> Bitcoin
                </span>
                <span className="converter-result-prov">Lightning</span>
              </div>
              <div className="converter-result-val">
                {num(satsVal)} sats
              </div>
            </div>
          </div>

          {/* Minimalist Footnote Note */}
          <div className="converter-footer-note">
            <span className="converter-zero-fee">
              <i className="ti ti-bolt" /> 0% fee cross-border exchange
            </span>
            <span>1 BTC = ${num(rate.btcUsd)} · KES {num(rate.btcKes)}</span>
          </div>

          {/* Action CTA Button */}
          <button
            type="button"
            className="btn btn-gold converter-cta-btn"
            onClick={() => setQuickOpen(true)}
          >
            <span>Send Money with This Rate</span>
            <i className="ti ti-arrow-right" />
          </button>
        </div>
      </div>

      <QuickProductModal
        isOpen={quickOpen}
        onClose={() => setQuickOpen(false)}
        initialProduct="send"
        initialAmount={String(Math.round(kesVal || 1000))}
      />
    </section>
  );
}

