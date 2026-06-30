"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { useRate } from "@/lib/rate-context";
import { num, fmtKES } from "@/lib/format";
import { getLocks, getSavingsDeposits, addToLock, postLockMessage } from "@/lib/api";
import type { SavingsLock, SavingsDeposit } from "@/types";
import ChamaGrowthChart from "@/components/app/ChamaGrowthChart";
import ContributeModal from "@/components/app/ContributeModal";
import LockCard from "@/components/app/LockCard";
import { bucketDeposits, type Preset } from "@/lib/bucket";

const CURRENT_HANDLE = "@wanjiku";
const CURRENT_NAME   = "Wanjiku Kamau";

export default function SavingsPage() {
  const rate = useRate();
  const router = useRouter();
  const [locks, setLocks] = useState<SavingsLock[]>([]);
  const [deposits, setDeposits] = useState<SavingsDeposit[]>([]);
  const [preset, setPreset] = useState<Preset>("Monthly");
  const [contributingLock, setContributingLock] = useState<SavingsLock | null>(null);
  const [contributing, setContributing] = useState(false);

  useEffect(() => {
    getLocks().then(setLocks);
    getSavingsDeposits().then(setDeposits);
  }, []);

  const totalPrincipal = locks.reduce((s, l) => s + l.principalSats, 0);
  const totalAccrued = locks.reduce((s, l) => s + l.accruedSats, 0);
  const points = bucketDeposits(deposits, preset);

  async function handleContribute(sats: number) {
    if (!contributingLock) return;
    setContributing(true);
    const updated = await addToLock(contributingLock.id, sats);
    // Post activity message; for multi-member locks this notifies all participants.
    // TODO(backend): fan-out to every participant in realtime (multi-member only)
    // TODO(backend): for chama-kind, also mirror into the linked chama chat
    await postLockMessage(updated.id, {
      kind: "deposit",
      authorHandle: CURRENT_HANDLE,
      authorName: CURRENT_NAME,
      body: `${CURRENT_NAME} deposited ${fmtKES(sats, rate, 0)} (~${num(sats)} sats).`,
      meta: { sats },
    });
    setContributing(false);
    setContributingLock(null);
    router.push(`/savings/${updated.id}?justDeposited=1`);
  }

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
        <div className="card">
          <div className="stat"><span className="l">Total locked</span><span className="v">{num(totalPrincipal)} sats</span></div>
          <p className="note" style={{ marginTop: 8 }}>≈ KES {num(totalPrincipal * rate.kesPerSat)}</p>
        </div>
        <div className="card">
          <div className="stat"><span className="l">Interest accrued</span><span className="v" style={{ color: "var(--emerald-deep)" }}>+{num(totalAccrued)} sats</span></div>
          <p className="note" style={{ marginTop: 8 }}>Target ~5.2% APY · paid monthly</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          <div>
            <span className="chip-group-label">Recent</span>
            <div className="seg" role="group" aria-label="Recent timeframes">
              {(["Daily", "Weekly", "Monthly"] as const).map((p) => (
                <button key={p} aria-pressed={preset === p} className={preset === p ? "on" : ""}
                  onClick={() => setPreset(p)}>{p}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="chip-group-label">Quarters</span>
            <div className="seg" role="group" aria-label="Calendar quarters">
              {(["Q1", "Q2", "Q3"] as const).map((p) => (
                <button key={p} aria-pressed={preset === p} className={preset === p ? "on" : ""}
                  onClick={() => setPreset(p)}>{p}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="chip-group-label">Years</span>
            <div className="seg" role="group" aria-label="Year ranges">
              {(["1Y", "2Y", "3Y", "4Y", "5Y", "6Y", "7Y", "8Y", "9Y", "10Y"] as const).map((p) => (
                <button key={p} aria-pressed={preset === p} className={preset === p ? "on" : ""}
                  onClick={() => setPreset(p)}>{p}</button>
              ))}
            </div>
          </div>
        </div>
        <ChamaGrowthChart
          title="Deposits over time"
          showRange={false}
          series={[{ key: "deposits", label: "Deposits", color: "var(--forest)", points }]}
        />
      </div>

      {locks.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17, marginBottom: 4 }}>
            Your locks
          </h2>
          <div className="lock-list">
            {locks.map((lock) => (
              <LockCard
                key={lock.id}
                lock={lock}
                rate={rate}
                onContribute={() => setContributingLock(lock)}
              />
            ))}
          </div>
        </div>
      )}

      {contributingLock && (
        <ContributeModal
          lock={contributingLock}
          onConfirm={handleContribute}
          onCancel={() => setContributingLock(null)}
          loading={contributing}
        />
      )}
    </>
  );
}
