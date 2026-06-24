"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import { createLock } from "@/lib/api";

export default function LockPage() {
  const rate = useRate();
  const router = useRouter();
  const [sats, setSats] = useState("100000");
  const [years, setYears] = useState(5);

  const satsNum = parseInt(sats.replace(/[^0-9]/g, ""), 10) || 0;
  const projected = Math.round(satsNum * (Math.pow(1.052, years) - 1)); // illustrative

  async function onLock() {
    await createLock(satsNum, years);
    router.push("/savings");
  }

  return (
    <>
      <h1 className="page-title">New savings lock</h1>
      <p className="page-sub">Lock sats away and earn a share of treasury yield.</p>

      <div className="card" style={{ marginTop: 20 }}>
        <label className="field-group">
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>Amount in sats</span>
          <input className="amount-input" inputMode="numeric" value={sats}
            onChange={(e) => setSats(e.target.value)} />
        </label>
        <p className="note" style={{ textAlign: "center", marginTop: 10 }}>≈ KES {num(satsNum * rate.kesPerSat, 2)}</p>

        <div style={{ marginTop: 22 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>Lock term</span>
          <div className="seg" style={{ marginTop: 8 }}>
            {[5, 7, 10].map((y) => (
              <button key={y} className={years === y ? "on" : ""} onClick={() => setYears(y)}>{y} years</button>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginTop: 20, background: "var(--cream)", border: "none", boxShadow: "none" }}>
          <div className="stat">
            <span className="l">Projected interest at ~5.2% (illustrative)</span>
            <span className="v" style={{ color: "var(--emerald-deep)" }}>+{num(projected)} sats</span>
          </div>
          <p className="note" style={{ marginTop: 8 }}>
            Returns are not guaranteed — interest is paid only from actual pool yield.
            Your principal always comes back in full.
          </p>
        </div>

        <Button block variant="gold" style={{ marginTop: 18 }} onClick={onLock} disabled={!satsNum}>
          <i className="ti ti-lock" /> Lock {num(satsNum)} sats
        </Button>
      </div>
    </>
  );
}
