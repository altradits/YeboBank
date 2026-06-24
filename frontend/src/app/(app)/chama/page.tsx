"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { useRate } from "@/lib/rate-context";
import { num, fmtKES } from "@/lib/format";
import { getChamas, getChamaJoinRequests, getChamaVotes } from "@/lib/api";
import type { Chama } from "@/types";

export default function ChamaPage() {
  const rate = useRate();
  const [chamas, setChamas] = useState<Chama[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    getChamas().then(setChamas);
  }, []);

  // Check for pending join requests or open votes across all member chamas
  useEffect(() => {
    if (chamas.length === 0) return;
    let count = 0;
    Promise.all(
      chamas.map(async (c) => {
        const [reqs, votes] = await Promise.all([
          getChamaJoinRequests(c.id),
          getChamaVotes(c.id),
        ]);
        count += reqs.filter((r) => r.status === "pending").length;
        count += votes.filter((v) => v.status === "open").length;
      }),
    ).then(() => setPendingCount(count));
  }, [chamas]);

  return (
    <>
      <div className="section-head">
        <div>
          <h1 className="page-title">Chamas</h1>
          <p className="page-sub">Save together. See everything.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/chama/portfolio">
            <Button variant="ghost"><i className="ti ti-chart-bar" /> My total across chamas</Button>
          </Link>
          <Link href="/chama/discover">
            <Button variant="ghost"><i className="ti ti-search" /> Discover</Button>
          </Link>
          <Link href="/chama/create">
            <Button variant="gold"><i className="ti ti-plus" /> New chama</Button>
          </Link>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="notif-banner">
          <i className="ti ti-bell" />
          <span>
            You have <strong>{pendingCount}</strong> pending {pendingCount === 1 ? "item" : "items"} (join requests or open votes) across your chamas.{" "}
            <Link href="/chama/discover">View all chamas</Link>
          </span>
        </div>
      )}

      <div className="stack" style={{ marginTop: 16 }}>
        {chamas.map((c) => {
          const myC = c.myContributionSats ?? 0;
          const poolC = c.poolContributionsSats ?? 0;
          const poolV = c.poolValueSats ?? c.balanceSats;
          const pct = poolC > 0 ? (myC / poolC) * 100 : 0;
          const gain = Math.round((pct / 100) * (poolV - poolC));
          const myValue = myC + gain;
          const hasStake = myC > 0;

          return (
            <Link key={c.id} href={`/chama/${c.id}`} style={{ display: "block" }}>
              <div className="card" style={{ cursor: "pointer", transition: "box-shadow .2s" }}>
                <div className="section-head" style={{ marginBottom: 6 }}>
                  <h2>{c.name}</h2>
                  <span className="badge confirmed">{c.memberCount}/{c.maxMembers} members</span>
                </div>
                <p className="note">{c.description}</p>
                {hasStake && (
                  <p className="stake-inline-summary">
                    Your share: <strong>{pct.toFixed(1)}%</strong>
                    {" · "}value {fmtKES(myValue, rate, 0)}
                    {" · "}
                    <span style={{ color: gain >= 0 ? "var(--emerald-deep)" : "var(--red)" }}>
                      {gain >= 0 ? "+" : ""}{fmtKES(gain, rate, 0)}
                    </span>
                  </p>
                )}
                <div className="grid-2" style={{ marginTop: 14 }}>
                  <div className="stat">
                    <span className="l">Group balance</span>
                    <span className="v">{num(c.balanceSats)} sats</span>
                    <span className="note">≈ KES {num(c.balanceSats * rate.kesPerSat)}</span>
                  </div>
                  <div className="stat">
                    <span className="l">Monthly contribution</span>
                    <span className="v">{num(c.contributionSats)} sats</span>
                    <span className="note">≈ KES {num(c.contributionSats * rate.kesPerSat)}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
