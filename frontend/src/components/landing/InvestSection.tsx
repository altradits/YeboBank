"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import QuickProductModal from "./QuickProductModal";

import CandleChart from "@/components/ui/candle-chart";

// #invest — Friends & Family investing.
export default function InvestSection() {
  const router = useRouter();
  const [quickOpen, setQuickOpen] = useState(false);

  return (
    <section className="sec" id="invest" style={{ position: "relative" }}>
      <div className="wrap" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 64, alignItems: "center" }}>

        {/* LEFT — Interactive Professional Candlestick Chart */}
        <div className="reveal d2">
          <div className="invest-curve-card" style={{
            border: "1px solid var(--border)",
            borderRadius: 24,
            padding: "24px 22px",
            background: "var(--surface)",
            boxShadow: "var(--shadow-2)",
            backdropFilter: "blur(16px)",
            overflow: "hidden",
          }}>
            <CandleChart
              symbol="BTC/KES"
              exchange="YEBO TREASURY"
              ceil={13500000}
              priceFmt={(n) => `KES ${Math.round(n).toLocaleString()}`}
              axisFmt={(n) => `${(n / 1000000).toFixed(1)}M`}
              seed={73}
            />
          </div>
        </div>

        {/* RIGHT — Hero Authority Copy */}
        <div className="reveal d1">
          <h2 className="hero-verb-h" style={{ marginBottom: "1rem" }}>
            <span className="hero-verb-word gold">Invest.</span>
          </h2>
          <p className="hero-verb-sub">
            Capital stewarded personally in verified real-world assets with monthly compounded returns. Fees only on profit.
          </p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 24 }}>
            <Button variant="gold" onClick={() => setQuickOpen(true)}>
              Invest
            </Button>
            <Button variant="ghost" onClick={() => router.push("/login?redirect=/mlinzi")}>
              Manage
            </Button>
          </div>
        </div>

      </div>
      <style>{`@media (max-width: 900px) { #invest .wrap { grid-template-columns: 1fr !important } }`}</style>
      <QuickProductModal
        isOpen={quickOpen}
        onClose={() => setQuickOpen(false)}
        initialProduct="invest"
      />
    </section>
  );
}

