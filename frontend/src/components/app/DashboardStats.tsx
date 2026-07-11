"use client";

import { num, fmtKESraw } from "@/lib/format";

interface DashboardStatsProps {
  lockedSats: number;
  interestKes: number;
  targetApy: number;
}

export default function DashboardStats({ lockedSats, interestKes, targetApy }: DashboardStatsProps) {
  return (
    <div className="dash-stats-row">
      <div className="dash-stat-card">
        <i className="ti ti-lock dash-stat-icon dash-stat-icon--lock" />
        <div>
          <span className="dash-stat-label">Locked savings</span>
          <span className="dash-stat-value">{num(lockedSats)} <small>sats</small></span>
        </div>
      </div>
      <div className="dash-stat-card">
        <i className="ti ti-trending-up dash-stat-icon dash-stat-icon--earn" />
        <div>
          <span className="dash-stat-label">Interest earned</span>
          <span className="dash-stat-value dash-stat-value--green">{fmtKESraw(interestKes, 2)}</span>
        </div>
      </div>
      <div className="dash-stat-card">
        <i className="ti ti-chart-pie dash-stat-icon dash-stat-icon--apy" />
        <div>
          <span className="dash-stat-label">Target APY</span>
          <span className="dash-stat-value">~{targetApy.toFixed(1)}<small>%</small></span>
        </div>
      </div>
    </div>
  );
}
