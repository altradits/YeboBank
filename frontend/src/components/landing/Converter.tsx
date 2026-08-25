"use client";

import { useState, useEffect } from "react";
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
  const [googleRates, setGoogleRates] = useState<{ kesEtb: number; kesUsd: number } | null>(null);

  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/KES")
      .then((r) => r.json())
      .then((data) => {
        if (data?.rates?.ETB && data?.rates?.USD) {
          setGoogleRates({
            kesEtb: data.rates.ETB,
            kesUsd: data.rates.USD,
          });
        }
      })
      .catch(() => {});
  }, []);

  const value = parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
  let sats: number;
  if (unit === "kes") sats = value * rate.satsPerKes;
  else if (unit === "sats") sats = value;
  else sats = value * 1e8;
  const btc = sats / 1e8;

  // Google Finance Benchmark and Fee Calculation (1% Fee)
  const kesEquivalent = unit === "kes" ? value : sats * rate.kesPerSat;
  
  const benchmarkKesEtb = googleRates?.kesEtb || 1.26174;
  const etbBenchmark = Math.round(kesEquivalent * benchmarkKesEtb); 
  const etbFee = Math.round(etbBenchmark * 0.01);
  const etbPayout = etbBenchmark - etbFee;
  
  const benchmarkKesUsd = googleRates?.kesUsd || (1 / 129.5);
  const zaadUsdBenchmark = parseFloat((kesEquivalent * benchmarkKesUsd).toFixed(2));
  const zaadUsdFee = parseFloat((zaadUsdBenchmark * 0.01).toFixed(2));
  const zaadUsdPayout = (zaadUsdBenchmark - zaadUsdFee).toFixed(2);

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
          </div>

          {/* ── Real-Time Pre-Conversion Regional Purchasing Power Comparison ── */}
          <div className="corridor-power-box" style={{ marginTop: 20 }}>
            <div className="cpb-header">
              <span className="cpb-tag">Live Regional Purchasing Power</span>
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
                  <div className="cpb-broker-val" style={{ opacity: 0.8 }}>
                    <span>Google Finance Benchmark:</span>
                    <span>ETB {num(etbBenchmark)}</span>
                  </div>
                  <div className="cpb-broker-val" style={{ color: "var(--gold)", opacity: 0.9 }}>
                    <span>YeboBank Fee (1%):</span>
                    <span>-ETB {num(etbFee)}</span>
                  </div>
                  <div className="cpb-live-val" style={{ marginTop: 4, paddingTop: 4, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                    <span>You Receive:</span>
                    <strong>ETB {num(etbPayout)}</strong>
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
                  <div className="cpb-broker-val" style={{ opacity: 0.8 }}>
                    <span>Google Finance Benchmark:</span>
                    <span>${zaadUsdBenchmark.toFixed(2)} USD</span>
                  </div>
                  <div className="cpb-broker-val" style={{ color: "var(--gold)", opacity: 0.9 }}>
                    <span>YeboBank Fee (1%):</span>
                    <span>-${zaadUsdFee.toFixed(2)} USD</span>
                  </div>
                  <div className="cpb-live-val" style={{ marginTop: 4, paddingTop: 4, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                    <span>You Receive:</span>
                    <strong>${zaadUsdPayout} USD</strong>
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
