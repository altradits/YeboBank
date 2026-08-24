"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import Button from "@/components/ui/Button";
import QuickProductModal from "./QuickProductModal";

type Unit = "kes" | "sats" | "btc";

export default function Converter() {
  const router = useRouter();
  const rate = useRate();
  const [unit, setUnit] = useState<Unit>("kes");
  const [raw, setRaw] = useState("1,000");
  const [quickOpen, setQuickOpen] = useState(false);

  const value = parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
  let sats: number;
  if (unit === "kes") sats = value * rate.satsPerKes;
  else if (unit === "sats") sats = value;
  else sats = value * 1e8;
  const btc = sats / 1e8;

  // Real-time pre-conversion cross-border buying power calculation
  const kesEquivalent = unit === "kes" ? value : sats * rate.kesPerSat;
  const etbReal = Math.round(kesEquivalent * rate.kesEtb);
  const etbBorderBroker = Math.round(kesEquivalent * 0.80); // Border brokers often force 1:1 or 0.8:1
  const etbSaved = Math.max(0, etbReal - etbBorderBroker);

  const zaadUsdReal = (kesEquivalent * rate.kesUsd).toFixed(2);
  const zaadUsdBroker = (kesEquivalent / 158).toFixed(2);
  const zaadUsdSaved = (parseFloat(zaadUsdReal) - parseFloat(zaadUsdBroker)).toFixed(2);

  return (
    <section className="sec" id="convert">
      <div className="wrap conv-wrap">
        <div className="reveal" style={{ textAlign: "center" }}>
          <h2 className="h2">
            Convert.<br />
            <span className="gold-accent">Zero spread. Zero broker markups.</span>
          </h2>
          <p className="lead" style={{ margin: "16px auto 0", maxWidth: 640 }}>
            Live fair-market purchasing power across East African corridors — see exactly what arrives before you send.
          </p>
        </div>

        <div className="calc reveal d1">
          <div className="field">
            <input
              type="text"
              inputMode="decimal"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              aria-label="Amount to convert"
            />
            <div className="unit" role="tablist" aria-label="Input unit">
              {(["kes", "sats", "btc"] as Unit[]).map((u) => (
                <button key={u} className={unit === u ? "on" : ""} onClick={() => setUnit(u)}>
                  {u.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="out">
            <div className="ocard gold"><div className="ok">In sats</div><div className="ov">{num(Math.round(sats))} sats</div></div>
            <div className="ocard grn"><div className="ok">In shillings</div><div className="ov">KES {num(sats * rate.kesPerSat, 2)}</div></div>
            <div className="ocard"><div className="ok">In Bitcoin</div><div className="ov">{btc.toFixed(8)} BTC</div></div>
            <div className="ocard"><div className="ok">In US dollars</div><div className="ov">${num(btc * rate.btcUsd, 2)}</div></div>
          </div>

          {/* ── Real-Time Pre-Conversion Regional Purchasing Power Comparison ── */}
          <div className="corridor-power-box" style={{ marginTop: 20 }}>
            <div className="cpb-header">
              <span className="cpb-tag">Live Regional Purchasing Power</span>
              <span className="cpb-vs">vs. Informal Border Cash Brokers</span>
            </div>

            <div className="cpb-grid">
              {/* Ethiopia Corridor */}
              <div className="cpb-item">
                <div className="cpb-dest">
                  <span className="cpb-flag">🇪🇹</span>
                  <div>
                    <b>Ethiopia (Telebirr / CBE)</b>
                    <small>Direct Mobile Money Payout</small>
                  </div>
                </div>
                <div className="cpb-rates">
                  <div className="cpb-live-val">
                    <span>YeboBank Sats:</span>
                    <strong>ETB {num(etbReal)}</strong>
                  </div>
                  <div className="cpb-broker-val">
                    <span>Border Cash (1:1 / 0.8:1):</span>
                    <s>ETB {num(etbBorderBroker)}</s>
                  </div>
                  <div className="cpb-gain-val">
                    +ETB {num(etbSaved)} saved (0% broker fee)
                  </div>
                </div>
              </div>

              {/* Somalia Corridor */}
              <div className="cpb-item">
                <div className="cpb-dest">
                  <span className="cpb-flag">🇸🇴</span>
                  <div>
                    <b>Somalia (Zaad / Waaafi)</b>
                    <small>1:1 USD-backed Mobile Money</small>
                  </div>
                </div>
                <div className="cpb-rates">
                  <div className="cpb-live-val">
                    <span>YeboBank Sats:</span>
                    <strong>${zaadUsdReal} USD</strong>
                  </div>
                  <div className="cpb-broker-val">
                    <span>Border Cash Broker:</span>
                    <s>${zaadUsdBroker} USD</s>
                  </div>
                  <div className="cpb-gain-val">
                    +${zaadUsdSaved} USD saved instantly
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rate-note" style={{ marginTop: 14 }}>
            1 BTC = ${num(rate.btcUsd)} · KES {num(rate.btcKes)} · ETB {num(rate.btcEtb)} ({rate.source})
          </div>

          <div style={{ marginTop: 22, display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
            <Button variant="gold" onClick={() => setQuickOpen(true)}>
              Deposit
            </Button>
            <Button variant="ghost" onClick={() => router.push("/login?redirect=/dashboard")}>
              Transfer
            </Button>
          </div>
        </div>
      </div>

      <QuickProductModal
        isOpen={quickOpen}
        onClose={() => setQuickOpen(false)}
        initialProduct="savings"
        initialAmount={String(Math.round(sats * rate.kesPerSat))}
      />
    </section>
  );
}
