"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import { num } from "@/lib/format";
import type { SavingsLock, Rate } from "@/types";

const KIND_LABEL: Record<string, string> = { individual: "Individual", group: "Group", chama: "Chama" };

function progressPct(lock: SavingsLock): number {
  const start = new Date(lock.lockedAt).getTime();
  const end = new Date(lock.maturesAt).getTime();
  return Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100));
}

interface Props {
  lock: SavingsLock;
  rate: Rate;
  onContribute: () => void;
}

export default function LockCard({ lock, rate, onContribute }: Props) {
  const kind = lock.kind ?? "individual";
  const pct = progressPct(lock);
  // All active locks accept contributions — individual top-ups increase principalSats.
  // TODO(backend): decide whether a top-up extends maturity, starts a sub-lock, or keeps the original clock
  const canContribute = lock.status === "active";

  return (
    <div className="card">
      <div className="lock-list-item-head">
        <span className={`lock-kind-badge badge-${kind}`}>{KIND_LABEL[kind] ?? kind}</span>
        {lock.title && <span className="lock-list-item-title">{lock.title}</span>}
        <span className="lock-list-item-meta">{lock.lockYears}yr · {lock.status}</span>
      </div>

      <div className="lock-list-stats">
        <div>
          <div className="lock-list-stat-label">Principal</div>
          <div className="lock-list-stat-value">{num(lock.principalSats)} sats</div>
          <div className="note">≈ KES {num(lock.principalSats * rate.kesPerSat)}</div>
        </div>
        <div>
          <div className="lock-list-stat-label">Earned so far</div>
          <div className="lock-list-stat-value" style={{ color: "var(--emerald-deep)" }}>
            +{num(lock.accruedSats)} sats
          </div>
          <div className="note">≈ KES {num(lock.accruedSats * rate.kesPerSat)}</div>
        </div>
      </div>

      <div className="bar-track" style={{ marginTop: 12 }}>
        <div className="bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="note" style={{ marginTop: 4 }}>
        {pct.toFixed(1)}% elapsed · matures{" "}
        {new Date(lock.maturesAt).toLocaleDateString("en-KE", { year: "numeric", month: "short" })}
      </p>

      {/* Participant chips — group/chama only (individuals have no participants array) */}
      {lock.participants && lock.participants.length > 0 && (
        <div className="lock-participants-preview">
          {lock.participants.slice(0, 4).map((p) => (
            <span key={p.handle} className="lock-participant-chip">{p.handle}</span>
          ))}
          {lock.participants.length > 4 && (
            <span className="lock-participant-chip">+{lock.participants.length - 4}</span>
          )}
        </div>
      )}

      <div className="lock-actions">
        {canContribute && (
          <Button style={{ fontSize: 13, padding: "7px 16px" }} onClick={onContribute}>
            <i className="ti ti-plus" /> Add
          </Button>
        )}
        <Link href={`/savings/${lock.id}`}>
          <Button variant="ghost" style={{ fontSize: 13, padding: "7px 16px" }}>Details</Button>
        </Link>
      </div>
    </div>
  );
}
