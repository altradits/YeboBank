"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRate } from "@/lib/rate-context";
import { num, fmtKES } from "@/lib/format";
import { getChamas, getChamaJoinRequests, getChamaVotes } from "@/lib/api";
import { ATMCard } from "@/components/app/ATMCard";
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

  const totalPortfolioSats = chamas.reduce((s, c) => {
    const myC = c.myContributionSats ?? 0;
    const poolC = c.poolContributionsSats ?? 0;
    const poolV = c.poolValueSats ?? c.balanceSats;
    const pct = poolC > 0 ? (myC / poolC) * 100 : 0;
    const gain = Math.round((pct / 100) * (poolV - poolC));
    return s + myC + gain;
  }, 0);
  const totalContributed = chamas.reduce((s, c) => s + (c.myContributionSats ?? 0), 0);

  return (
    <>
      <ATMCard
        variant="dashboard"
        chipLabel="CHAMA"
        balanceLabel="CHAMA PORTFOLIO"
        sats={totalPortfolioSats || undefined}
        stats={[
          { label: "Active chamas", value: `${chamas.length}`, sub: "Groups I belong to" },
          { label: "Pending items", value: `${pendingCount}`, color: pendingCount > 0 ? "#C9A84C" : undefined, sub: "Requests & votes" },
          { label: "My contributions", value: `${num(totalContributed)} sats`, sub: `≈ KES ${num(Math.round(totalContributed * rate.kesPerSat))}` },
        ]}
        actions={[
          { icon: "ti-plus", label: "New Chama", path: "/chama/create" },
          { icon: "ti-search", label: "Discover", path: "/chama/discover" },
          { icon: "ti-chart-bar", label: "My Total", path: "/chama/portfolio" },
          { icon: "ti-layout-dashboard", label: "Dashboard", path: "/dashboard" },
        ]}
      />

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
