"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";

export default function BalanceCard({ sats }: { sats: number }) {
  const rate = useRate();
  const router = useRouter();
  const [view, setView] = useState<"kes" | "sats" | "btc">("kes");

  function show() {
    if (view === "sats") return `${num(sats)} sats`;
    if (view === "kes") return `KES ${num(sats * rate.kesPerSat, 2)}`;
    return `${(sats / 1e8).toFixed(5)} BTC`;
  }

  return (
    <div className="balance">
      <div className="head">
        <span className="lbl">Akiba yako · total balance</span>
        <span className="badge"><i className="ti ti-trending-up" /> +4,230 / mo</span>
      </div>
      <div className="amt">{show()}</div>
      <div className="conv">≈ ${num(sats / 1e8 * rate.btcUsd, 2)} · {num(sats)} sats</div>
      <div className="tog" role="tablist" aria-label="Balance unit">
        {(["kes", "sats", "btc"] as const).map((v) => (
          <button key={v} className={view === v ? "on" : ""} onClick={() => setView(v)}>
            {v.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="qa">
        <button className="q" onClick={() => router.push("/deposit")}><i className="ti ti-arrow-down" /> Add money</button>
        <button className="q" onClick={() => router.push("/withdraw")}><i className="ti ti-arrow-up" /> Withdraw</button>
        <button className="q" onClick={() => router.push("/send")}><i className="ti ti-send" /> Send</button>
        <button className="q" onClick={() => router.push("/savings/lock")}><i className="ti ti-lock" /> Lock</button>
      </div>
    </div>
  );
}
