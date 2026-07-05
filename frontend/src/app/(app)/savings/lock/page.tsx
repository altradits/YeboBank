"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import {
  createLock, createGroupLock, getChamas,
  getMyPendingInvites, acceptInvite,
} from "@/lib/api";
import { ATMCard } from "@/components/app/ATMCard";
import type { Chama, PendingInvite } from "@/types";

type LockKind = "individual" | "group" | "chama";

export default function LockPage() {
  const rate = useRate();
  const router = useRouter();

  const [kind, setKind] = useState<LockKind>("individual");
  const [sats, setSats] = useState("100000");
  const [years, setYears] = useState(5);

  // group-specific
  const [groupTitle, setGroupTitle] = useState("");
  const [groupHandles, setGroupHandles] = useState("");

  // chama-specific
  const [myChamas, setMyChamas] = useState<Chama[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [chamaLoading, setChamaLoading] = useState(false);

  const [loading, setLoading] = useState(false);

  const satsNum = parseInt(sats.replace(/[^0-9]/g, ""), 10) || 0;
  const projected = Math.round(satsNum * (Math.pow(1.052, years) - 1));

  useEffect(() => {
    if (kind !== "chama") return;
    setChamaLoading(true);
    Promise.all([getChamas(), getMyPendingInvites()]).then(([chamas, invites]) => {
      setMyChamas(chamas);
      setPendingInvites(invites);
      setChamaLoading(false);
    });
  }, [kind]);

  async function onLockIndividual() {
    setLoading(true);
    const lock = await createLock(satsNum, years);
    router.push(`/savings/${lock.id}?justDeposited=1`);
  }

  async function onLockGroup() {
    if (!satsNum || !groupTitle.trim()) return;
    setLoading(true);
    const handles = groupHandles.split(",").map((h) => h.trim()).filter(Boolean);
    const lock = await createGroupLock(satsNum, years, groupTitle.trim(), handles);
    router.push(`/savings/${lock.id}?justDeposited=1`);
  }

  function onLockWithChama(chamaId: string) {
    router.push(`/chama/${chamaId}?intent=lock&amount=${satsNum}&years=${years}`);
  }

  async function onAcceptInviteAndLock(invite: PendingInvite) {
    setLoading(true);
    await acceptInvite(invite.id);
    router.push(`/chama/${invite.targetId}?intent=lock&amount=${satsNum}&years=${years}`);
  }

  const canSubmitGroup = !loading && satsNum > 0 && groupTitle.trim().length > 0;
  const canSubmitIndividual = !loading && satsNum > 0;

  return (
    <>
      <h1 className="page-title">New savings lock</h1>
      <p className="page-sub">Lock sats away and earn a share of treasury yield.</p>

      <ATMCard variant="full" balanceLabel="BALANCE AVAILABLE TO LOCK" />

      {/* Kind selector */}
      <div className="card" style={{ marginTop: 20 }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>Lock type</span>
        <div className="seg" style={{ marginTop: 8 }}>
          {(["individual", "group", "chama"] as const).map((k) => (
            <button key={k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}>
              {k === "individual" ? "Individual" : k === "group" ? "Group" : "Chama"}
            </button>
          ))}
        </div>
        <p className="note" style={{ marginTop: 8 }}>
          {kind === "individual" && "A private lock only you can access."}
          {kind === "group" && "A shared lock — invite members to contribute together."}
          {kind === "chama" && "Lock savings through your chama for collective yield."}
        </p>
      </div>

      {/* Amount + term (shared) */}
      <div className="card" style={{ marginTop: 16 }}>
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
      </div>

      {/* Group-specific fields */}
      {kind === "group" && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="field-group" style={{ marginBottom: 14 }}>
            <label>Group name</label>
            <input className="input" placeholder="e.g. Kilimani Savings Group" value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)} />
          </div>
          <div className="field-group">
            <label>Invite members (optional)</label>
            <input className="input" placeholder="@handle1, @handle2 …" value={groupHandles}
              onChange={(e) => setGroupHandles(e.target.value)} />
            <p className="note" style={{ marginTop: 4 }}>Comma-separated handles. Members can contribute after accepting.</p>
          </div>
        </div>
      )}

      {/* Chama picker */}
      {kind === "chama" && (
        <div className="card" style={{ marginTop: 16 }}>
          {chamaLoading ? (
            <p className="note">Loading your chamas…</p>
          ) : myChamas.length === 0 && pendingInvites.length === 0 ? (
            <div>
              <p className="note" style={{ marginBottom: 14 }}>You are not in a chama yet.</p>
              <Link href="/chama/discover"><Button variant="ghost">Discover chamas</Button></Link>
            </div>
          ) : (
            <>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, marginBottom: 12 }}>
                Select a chama to lock with
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {myChamas.map((c) => (
                  <button
                    key={c.id}
                    className="lock-chama-option"
                    onClick={() => onLockWithChama(c.id)}
                    disabled={!satsNum}
                  >
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>{c.name}</div>
                      <div className="note" style={{ marginTop: 2 }}>{c.memberCount} members</div>
                    </div>
                    <span style={{ color: "var(--emerald-deep)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>
                      Lock here
                    </span>
                  </button>
                ))}
                {pendingInvites.map((inv) => (
                  <button
                    key={inv.id}
                    className="lock-chama-option lock-chama-invite"
                    onClick={() => onAcceptInviteAndLock(inv)}
                    disabled={loading || !satsNum}
                  >
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>{inv.targetName}</div>
                      <div className="note" style={{ marginTop: 2 }}>Pending invite</div>
                    </div>
                    <span style={{ color: "var(--gold-text)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>
                      Accept &amp; lock
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Projected yield */}
      <div className="card" style={{ marginTop: 16, background: "var(--cream)", border: "none", boxShadow: "none" }}>
        <div className="stat">
          <span className="l">Projected interest at ~5.2% (illustrative)</span>
          <span className="v" style={{ color: "var(--emerald-deep)" }}>+{num(projected)} sats</span>
        </div>
        <p className="note" style={{ marginTop: 8 }}>
          Returns are not guaranteed — interest is paid only from actual pool yield.
          Your principal always comes back in full.
        </p>
      </div>

      {/* Submit (individual + group only — chama navigates on card click) */}
      {kind !== "chama" && (
        <Button
          block variant="gold" style={{ marginTop: 18 }}
          onClick={kind === "individual" ? onLockIndividual : onLockGroup}
          disabled={kind === "individual" ? !canSubmitIndividual : !canSubmitGroup}
        >
          <i className="ti ti-lock" />
          {kind === "individual"
            ? `Lock ${num(satsNum)} sats`
            : `Create group & lock ${num(satsNum)} sats`}
        </Button>
      )}
    </>
  );
}
