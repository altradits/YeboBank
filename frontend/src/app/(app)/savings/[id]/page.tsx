"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import { getLock, addToLock } from "@/lib/api";
import type { SavingsLock } from "@/types";
import ContributeModal from "@/components/app/ContributeModal";

const KIND_LABEL: Record<string, string> = { individual: "Individual", group: "Group", chama: "Chama" };

function progressPct(lock: SavingsLock): number {
  const start = new Date(lock.lockedAt).getTime();
  const end = new Date(lock.maturesAt).getTime();
  return Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100));
}

export default function LockDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const rate = useRate();

  const [lock, setLock] = useState<SavingsLock | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [contributeModal, setContributeModal] = useState(false);
  const [contributing, setContributing] = useState(false);

  useEffect(() => {
    getLock(id).then((l) => { setLock(l); setPageLoading(false); }).catch(() => setPageLoading(false));
  }, [id]);

  async function handleContribute(sats: number) {
    if (!lock) return;
    setContributing(true);
    const updated = await addToLock(lock.id, sats);
    setLock(updated);
    setContributing(false);
    setContributeModal(false);
  }

  if (pageLoading) {
    return <p className="note" style={{ marginTop: 40, textAlign: "center" }}>Loading…</p>;
  }

  if (!lock) {
    return (
      <>
        <h1 className="page-title">Lock not found</h1>
        <Link href="/savings">
          <Button variant="ghost" style={{ marginTop: 16 }}>← Back to savings</Button>
        </Link>
      </>
    );
  }

  const kind = lock.kind ?? "individual";
  const pct = progressPct(lock);
  // All active locks accept contributions — top-ups increase principalSats.
  // TODO(backend): decide whether a top-up extends maturity, starts a sub-lock, or keeps the original clock
  const canContribute = lock.status === "active";
  const maturesDate = new Date(lock.maturesAt).toLocaleDateString("en-KE", {
    year: "numeric", month: "long", day: "numeric",
  });
  const lockedDate = new Date(lock.lockedAt).toLocaleDateString("en-KE", {
    year: "numeric", month: "short", day: "numeric",
  });

  return (
    <>
      <div className="section-head">
        <div>
          <h1 className="page-title">{lock.title ?? "Savings lock"}</h1>
          <p className="page-sub">
            <span className={`lock-kind-badge badge-${kind}`}>{KIND_LABEL[kind] ?? kind}</span>
            {" · "}{lock.lockYears}yr lock · matures {maturesDate}
          </p>
        </div>
        <Link href="/savings"><Button variant="ghost">← All locks</Button></Link>
      </div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="stat">
            <span className="l">Principal</span>
            <span className="v">{num(lock.principalSats)} sats</span>
          </div>
          <p className="note" style={{ marginTop: 8 }}>≈ KES {num(lock.principalSats * rate.kesPerSat)}</p>
        </div>
        <div className="card">
          <div className="stat">
            <span className="l">Accrued interest</span>
            <span className="v" style={{ color: "var(--emerald-deep)" }}>+{num(lock.accruedSats)} sats</span>
          </div>
          <p className="note" style={{ marginTop: 8 }}>≈ KES {num(lock.accruedSats * rate.kesPerSat)}</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>Time elapsed</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--soft)" }}>{pct.toFixed(1)}%</span>
        </div>
        <div className="bar-track">
          <div className="bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="note" style={{ marginTop: 8 }}>Locked {lockedDate}</p>
      </div>

      {/* Add contribution — available for all active locks */}
      {canContribute && (
        <div className="card" style={{ marginTop: 16 }}>
          <Button block variant="gold" onClick={() => setContributeModal(true)}>
            <i className="ti ti-plus" /> Add contribution
          </Button>
        </div>
      )}

      {/* Participants — group/chama only (individuals have no participants array) */}
      {lock.participants && lock.participants.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
            Participants
          </h2>
          <div className="lock-participants">
            {lock.participants.map((p) => (
              <div key={p.handle} className="lock-participant-row">
                <div>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>{p.name}</span>
                  <span className="note" style={{ marginLeft: 6 }}>{p.handle}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>
                    {num(p.contributedSats)} sats
                  </div>
                  <div className="note">≈ KES {num(p.contributedSats * rate.kesPerSat)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {kind === "chama" && lock.chamaId && (
        <div className="card" style={{ marginTop: 16 }}>
          <Link href={`/chama/${lock.chamaId}`}>
            <Button block variant="ghost">
              <i className="ti ti-users" /> View chama
            </Button>
          </Link>
        </div>
      )}

      {contributeModal && (
        <ContributeModal
          lock={lock}
          onConfirm={handleContribute}
          onCancel={() => setContributeModal(false)}
          loading={contributing}
        />
      )}
    </>
  );
}
