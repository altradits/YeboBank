"use client";

import type { MyChamaStake } from "@/types";
import { useRate } from "@/lib/rate-context";
import { num, fmtKES } from "@/lib/format";

interface Props {
  stake: MyChamaStake;
}

export default function MyChamaStakePanel({ stake }: Props) {
  const rate = useRate();
  const gainPositive = stake.myGainSats >= 0;

  return (
    <div className="stake-panel">
      <div className="stake-stats">
        <div className="stake-stat">
          <span className="stake-label">You&apos;ve put in</span>
          <span className="stake-value">{num(stake.myContributionSats)} sats</span>
          <span className="stake-sub">≈ {fmtKES(stake.myContributionSats, rate, 0)}</span>
        </div>
        <div className="stake-stat">
          <span className="stake-label">Your value now</span>
          <span className="stake-value">{num(stake.myValueSats)} sats</span>
          <span className="stake-sub">≈ {fmtKES(stake.myValueSats, rate, 0)}</span>
        </div>
        <div className="stake-stat">
          <span className="stake-label">Gain</span>
          <span className={`stake-value${gainPositive ? " gain-pos" : " gain-neg"}`}>
            {gainPositive ? "+" : ""}{num(stake.myGainSats)} sats
          </span>
          <span className="stake-sub">
            ≈ {gainPositive ? "+" : ""}{fmtKES(stake.myGainSats, rate, 0)}
          </span>
        </div>
      </div>

      <div className="stake-share-row">
        <div className="stake-share-header">
          <span className="stake-label">Your share of the pool</span>
          <span className="stake-pct">{stake.mySharePct.toFixed(1)}%</span>
        </div>
        <div className="bar-track stake-bar-track">
          <div
            className="bar-fill stake-bar-fill"
            style={{ width: `${Math.min(100, stake.mySharePct)}%` }}
          />
        </div>
        <p className="stake-bar-sub">your KES vs the group&apos;s total</p>
      </div>
    </div>
  );
}
