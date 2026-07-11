"use client";

import { num, fmtKESraw } from "@/lib/format";

interface AumOverviewCardsProps {
  totalAumKes: number;
  totalAumSats: number;
  incomeCount: number;
  investorCount: number;
  feeEarnedKes: number;
  pendingAccess: number;
  pendingWithdrawals: number;
}

export default function AumOverviewCards({
  totalAumKes, totalAumSats, incomeCount, investorCount,
  feeEarnedKes, pendingAccess, pendingWithdrawals,
}: AumOverviewCardsProps) {
  const cards = [
    {
      label: "Total AUM",
      primary: fmtKESraw(totalAumKes, 0),
      secondary: `${num(totalAumSats)} sats`,
      icon: "ti-building-bank",
      accent: "var(--gold)",
      bg: "rgba(168,116,0,.09)",
    },
    {
      label: "Income Sources",
      primary: String(incomeCount),
      secondary: "active investments",
      icon: "ti-chart-pie",
      accent: "var(--lime)",
      bg: "rgba(150,194,68,.09)",
    },
    {
      label: "Investors",
      primary: String(investorCount),
      secondary: "active positions",
      icon: "ti-users-group",
      accent: "var(--emerald-deep)",
      bg: "rgba(7,122,60,.09)",
    },
    {
      label: "Fee Earned (cycle)",
      primary: fmtKESraw(feeEarnedKes, 0),
      secondary: "2% of returns",
      icon: "ti-coins",
      accent: "var(--gold-soft)",
      bg: "rgba(196,144,32,.09)",
      badge: pendingAccess + pendingWithdrawals > 0
        ? `${pendingAccess + pendingWithdrawals} pending`
        : undefined,
    },
  ];

  return (
    <div className="aum-cards">
      {cards.map((c) => (
        <div key={c.label} className="aum-card">
          <div className="aum-card-icon" style={{ background: c.bg, color: c.accent }}>
            <i className={`ti ${c.icon}`} />
          </div>
          <div className="aum-card-body">
            <span className="aum-label">{c.label}</span>
            <span className="aum-primary">{c.primary}</span>
            <span className="aum-secondary">
              {c.secondary}
              {c.badge && <span className="aum-badge">{c.badge}</span>}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
