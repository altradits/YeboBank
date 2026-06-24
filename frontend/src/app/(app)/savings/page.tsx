"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import { getLocks } from "@/lib/api";
import type { SavingsLock } from "@/types";

export default function SavingsPage() {
  const rate = useRate();
  const [locks, setLocks] = useState<SavingsLock[]>([]);

  useEffect(() => { getLocks().then(setLocks); }, []);

  const totalPrincipal = locks.reduce((s, l) => s + l.principalSats, 0);
  const totalAccrued = locks.reduce((s, l) => s + l.accruedSats, 0);

  return (
    <>
      <div className="section-head">
        <div>
          <h1 className="page-title">Savings</h1>
          <p className="page-sub">Locked sats earning interest from real yield.</p>
        </div>
        <Link href="/savings/lock"><Button variant="gold"><i className="ti ti-plus" /> New lock</Button></Link>
      </div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card"><div className="stat"><span className="l">Total locked</span><span className="v">{num(totalPrincipal)} sats</span></div>
          <p className="note" style={{ marginTop: 8 }}>≈ KES {num(totalPrincipal * rate.kesPerSat)}</p></div>
        <div className="card"><div className="stat"><span className="l">Interest accrued</span><span className="v" style={{ color: "var(--emerald-deep)" }}>+{num(totalAccrued)} sats</span></div>
          <p className="note" style={{ marginTop: 8 }}>Target ~5.2% APY · paid monthly</p></div>
      </div>

      <div className="stack" style={{ marginTop: 18 }}>
        {locks.map((l) => {
          const start = new Date(l.lockedAt).getTime();
          const end = new Date(l.maturesAt).getTime();
          const pct = Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100));
          return (
            <div className="card" key={l.id}>
              <div className="lock-card">
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17 }}>{num(l.principalSats)} sats</div>
                  <div className="note">Matures {new Date(l.maturesAt).toLocaleDateString()} · {l.lockYears}-year lock</div>
                </div>
                <span className="badge confirmed">{l.status}</span>
              </div>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
              <p className="note" style={{ marginTop: 8 }}>Earned so far: <b style={{ color: "var(--emerald-deep)" }}>+{num(l.accruedSats)} sats</b></p>
            </div>
          );
        })}
      </div>
    </>
  );
}
