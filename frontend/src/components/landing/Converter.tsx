"use client";

import { useState } from "react";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";

type Unit = "kes" | "sats" | "btc";

export default function Converter() {
  const rate = useRate();
  const [unit, setUnit] = useState<Unit>("kes");
  const [raw, setRaw] = useState("1,000");

  const value = parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
  let sats: number;
  if (unit === "kes") sats = value * rate.satsPerKes;
  else if (unit === "sats") sats = value;
  else sats = value * 1e8;
  const btc = sats / 1e8;

  return (
    <section className="sec" id="convert">
      <div className="wrap conv-wrap">
        <div className="reveal">
          <div className="kicker"><i className="ti ti-refresh" /> Live converter</div>
          <h2 className="h2">See it in <span className="grow">your money.</span></h2>
          <p className="lead">
            Sats, shillings, Bitcoin — same money, three ways to read it. Type any
            amount and watch it convert at the live market rate, the same one your
            deposits use.
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
          <div className="rate-note">
            <span className="pulse" /> 1 BTC = ${num(rate.btcUsd)} · KES {num(rate.btcKes)} ({rate.source})
          </div>
        </div>
      </div>
    </section>
  );
}
