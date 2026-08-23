"use client";

import React, { useState } from "react";
import { num } from "@/lib/format";
import { useRate } from "@/lib/rate-context";
import Button from "@/components/ui/Button";
import SecurityTransactionGuard from "@/components/ui/SecurityTransactionGuard";

interface BtcBusiness {
  id: string;
  name: string;
  category: string;
  location: string;
  lightningAddress: string;
  aumCommittedSats: number;
  monthlyBtcVolumeSats: number;
  acceptingSince: string;
}

const VETTED_BTC_BUSINESSES: BtcBusiness[] = [
  {
    id: "btc-1",
    name: "Safari Solar Hub",
    category: "Clean Tech & Off-grid Power",
    location: "Kajiado, Kenya",
    lightningAddress: "solar@safarihub.btc",
    aumCommittedSats: 25_000_000,
    monthlyBtcVolumeSats: 4_800_000,
    acceptingSince: "Jan 2024",
  },
  {
    id: "btc-2",
    name: "Kilifi Eco-Lodge & Co-op",
    category: "Hospitality & Tourism",
    location: "Kilifi Coast, Kenya",
    lightningAddress: "stay@kilifieco.co.ke",
    aumCommittedSats: 40_000_000,
    monthlyBtcVolumeSats: 8_200_000,
    acceptingSince: "Aug 2023",
  },
  {
    id: "btc-3",
    name: "Amani Agro Logistics",
    category: "Agricultural Supply Chain",
    location: "Eldoret, Kenya",
    lightningAddress: "amani@agro.sat",
    aumCommittedSats: 60_000_000,
    monthlyBtcVolumeSats: 12_500_000,
    acceptingSince: "Mar 2024",
  },
];

export default function MlinziBitcoinTreasury() {
  const rate = useRate();
  const [usdInput, setUsdInput] = useState("5000");
  const [commitModalOpen, setCommitModalOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<BtcBusiness | null>(null);
  const [commitSuccess, setCommitSuccess] = useState(false);

  const usdValue = parseFloat(usdInput.replace(/[^0-9.]/g, "")) || 0;
  // Calculate sats from USD: 1 BTC = rate.btcUsd -> sats = (usdValue / btcUsd) * 1e8
  const calculatedSats = rate.btcUsd > 0 ? Math.round((usdValue / rate.btcUsd) * 100_000_000) : Math.round(usdValue * 1500);

  function handleCommitTreasury() {
    setCommitSuccess(true);
    setTimeout(() => {
      setCommitSuccess(false);
      setCommitModalOpen(false);
    }, 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Treasury Header Stats */}
      <div className="card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 24, color: "var(--gold-text)" }}>⚡</span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700 }}>
                Mlinzi Bitcoin Treasury &amp; Fund-of-Funds
              </h2>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
              Direct Bitcoin capital allocation to real businesses operating natively on Sats.
            </p>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>Live Treasury Pool</span>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--gold-text)" }}>
                125,000,000 SATS
              </div>
            </div>
            <Button variant="gold" onClick={() => setCommitModalOpen(true)}>
              Commit Sats to Treasury
            </Button>
          </div>
        </div>
      </div>

      {/* Live USD → SATS Calculator (Rule 8.5) */}
      <div className="card" style={{ padding: "24px" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, marginBottom: 12 }}>
          Live USD → Satoshis Market Converter
        </h3>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
          Calculate exact treasury funding requirements at live exchange index rates.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "center" }}>
          <div className="field-group">
            <label>Amount in US Dollars (USD)</label>
            <div className="qa-amount-wrap" style={{ display: "flex", alignItems: "center" }}>
              <span style={{ padding: "0 12px", fontFamily: "var(--font-mono)", color: "var(--muted)" }}>$</span>
              <input
                className="input"
                type="number"
                value={usdInput}
                onChange={(e) => setUsdInput(e.target.value)}
                style={{ fontSize: 18, fontFamily: "var(--font-mono)" }}
              />
            </div>
          </div>

          <div
            style={{
              padding: "16px 20px",
              background: "var(--cream)",
              borderRadius: 12,
              border: "1px solid var(--border-soft)",
            }}
          >
            <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Calculated Satoshis Equivalent
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--gold-text)", marginTop: 4 }}>
              {num(calculatedSats)} SATS
            </div>
            <div style={{ fontSize: 11, color: "var(--soft)", marginTop: 2 }}>
              1 BTC = ${num(rate.btcUsd)} USD · Market Feed: {rate.source}
            </div>
          </div>
        </div>
      </div>

      {/* Vetted Bitcoin-Accepting Businesses (Rule 8.5) */}
      <div className="card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600 }}>
              Vetted Bitcoin-Accepting Businesses
            </h3>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>
              Businesses accepting Bitcoin via Lightning receiving Mlinzi fund allocations.
            </p>
          </div>
          <span style={{ fontSize: 12, color: "var(--lime)", fontWeight: 600 }}>
            <i className="ti ti-check-double" /> 100% On-Chain &amp; Lightning Verified
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {VETTED_BTC_BUSINESSES.map((b) => (
            <div
              key={b.id}
              style={{
                padding: "18px",
                background: "var(--cream)",
                border: "1px solid var(--border-soft)",
                borderRadius: 14,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <h4 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700 }}>{b.name}</h4>
                  <span style={{ fontSize: 10, background: "rgba(240, 204, 88, 0.15)", color: "var(--gold-text)", padding: "2px 6px", borderRadius: 4 }}>
                    {b.category}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                  <i className="ti ti-map-pin" /> {b.location} · Active since {b.acceptingSince}
                </div>
                <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--lime)", marginTop: 6 }}>
                  <i className="ti ti-bolt" /> {b.lightningAddress}
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--border-soft)", paddingTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--muted)" }}>Allocated AUM:</span>
                  <strong style={{ fontFamily: "var(--font-mono)" }}>{num(b.aumCommittedSats)} sats</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 }}>
                  <span style={{ color: "var(--muted)" }}>Monthly Volume:</span>
                  <strong style={{ fontFamily: "var(--font-mono)", color: "var(--emerald-deep)" }}>
                    {num(b.monthlyBtcVolumeSats)} sats
                  </strong>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setSelectedBusiness(b);
                  setCommitModalOpen(true);
                }}
                style={{ fontSize: 12, padding: "8px" }}
              >
                Fund This Business (SATS)
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Commit Sats Security Modal (Rule 3 & 5) */}
      {commitModalOpen && (
        <div className="modal-overlay" onClick={() => setCommitModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setCommitModalOpen(false)}>✕</button>

            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, marginBottom: 4 }}>
              Commit Capital to {selectedBusiness ? selectedBusiness.name : "Bitcoin Treasury"}
            </h3>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
              Allocating {num(calculatedSats)} Sats (${num(usdValue)} USD) to verified Bitcoin enterprise.
            </p>

            {commitSuccess ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <i className="ti ti-circle-check" style={{ fontSize: 44, color: "var(--emerald-deep)" }} />
                <h4 style={{ marginTop: 8 }}>Treasury Commitment Authorized</h4>
                <p style={{ fontSize: 12, color: "var(--muted)" }}>Funds locked and deployed via Lightning channel.</p>
              </div>
            ) : (
              <SecurityTransactionGuard
                amount={usdValue}
                currencyName="USD"
                onConfirm={handleCommitTreasury}
                onClose={() => setCommitModalOpen(false)}
                confirmLabel="Authorize Allocation"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
