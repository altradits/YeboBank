"use client";

import { num, fmtKESraw } from "@/lib/format";

interface AgentFloatHeaderProps {
  floatSats: number;
  reserveSats: number;
  commissionEarnedSats: number;
  commissionRate: number;
  currency: "KES" | "Sats";
  onToggleCurrency: () => void;
  tillNumber?: string;
}

export default function AgentFloatHeader({
  floatSats, reserveSats, commissionEarnedSats,
  commissionRate, currency, onToggleCurrency, tillNumber,
}: AgentFloatHeaderProps) {
  const display = (sats: number) =>
    currency === "KES" ? `KSh ${fmtKESraw(sats * 0.0042, 0)}` : `${num(sats)} sats`;

  return (
    <div className="agent-float-header">
      <div className="agent-float-header__inner">
        {/* Float + commission */}
        <div className="afh-primary">
          <p className="afh-section-label">Float &amp; Commission</p>
          <div className="afh-row">
            <div className="afh-metric">
              <span className="afh-big">{display(floatSats)}</span>
              <span className="afh-chip afh-chip--float">Float</span>
            </div>
            <div className="afh-divider" />
            <div className="afh-metric">
              <span className="afh-big afh-big--green">{display(commissionEarnedSats)}</span>
              <span className="afh-chip afh-chip--earn">Today&apos;s Earnings</span>
            </div>
          </div>
          {tillNumber && (
            <p className="afh-till">
              <i className="ti ti-sim-card" /> Till: <strong>{tillNumber}</strong>
              &nbsp;·&nbsp; Rate: <strong>{(commissionRate * 100).toFixed(1)}%</strong>
            </p>
          )}
        </div>

        {/* Secondary stats */}
        <div className="afh-secondary">
          <div className="afh-stat">
            <span className="afh-stat-label">Reserve</span>
            <span className="afh-stat-val">{display(reserveSats)}</span>
          </div>

          {/* KES / Sats toggle */}
          <div className="afh-toggle">
            <button
              onClick={onToggleCurrency}
              className={currency === "KES" ? "active" : ""}
            >KES</button>
            <button
              onClick={onToggleCurrency}
              className={currency === "Sats" ? "active" : ""}
            >Sats</button>
          </div>
        </div>
      </div>

      {/* Bento stats */}
      <div className="afh-bento">
        <div className="afh-bento-card afh-bento-card--blue">
          <i className="ti ti-users" />
          <span className="afh-bento-label">Customers Served Today</span>
          <span className="afh-bento-val">34</span>
        </div>
        <div className="afh-bento-card afh-bento-card--green">
          <i className="ti ti-bolt" />
          <span className="afh-bento-label">Avg. Transaction Time</span>
          <span className="afh-bento-val">42s</span>
        </div>
        <div className="afh-bento-card afh-bento-card--gold">
          <i className="ti ti-trending-up" />
          <span className="afh-bento-label">Commission Growth</span>
          <span className="afh-bento-val">+12.5%</span>
        </div>
      </div>
    </div>
  );
}
