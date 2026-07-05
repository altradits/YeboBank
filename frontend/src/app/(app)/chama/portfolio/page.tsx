"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRate } from "@/lib/rate-context";
import { num, fmtKES } from "@/lib/format";
import { getChamaPortfolio, getChamaGrowth } from "@/lib/api";
import type { ChamaPortfolio, ChamaGrowthPoint } from "@/types";
import ChamaGrowthChart from "@/components/app/ChamaGrowthChart";
import { ATMCard } from "@/components/app/ATMCard";

const _MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function dateToLabel(date: string): string {
  const [, m] = date.split("-");
  return _MONTHS[(parseInt(m, 10) - 1) % 12] ?? date;
}

const CHAMA_COLORS = ["var(--emerald)", "var(--gold-soft)", "var(--forest-mid)"];

export default function PortfolioPage() {
  const rate = useRate();
  const [portfolio, setPortfolio] = useState<ChamaPortfolio | null>(null);
  const [combinedGrowth, setCombinedGrowth] = useState<ChamaGrowthPoint[]>([]);
  const [perChamaGrowth, setPerChamaGrowth] = useState<Record<string, ChamaGrowthPoint[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const p = await getChamaPortfolio();
      setPortfolio(p);

      // Load growth per chama and aggregate into combined series
      const allGrowth = await Promise.all(
        p.stakes.map((s) => getChamaGrowth(s.chamaId)),
      );

      // Store per-chama growth indexed by chamaId
      const growthMap: Record<string, ChamaGrowthPoint[]> = {};
      p.stakes.forEach((s, i) => { growthMap[s.chamaId] = allGrowth[i]; });
      setPerChamaGrowth(growthMap);

      // Aggregate all into a combined series
      const byDate = new Map<string, { contributedSats: number; valueSats: number }>();
      for (const series of allGrowth) {
        for (const pt of series) {
          const existing = byDate.get(pt.date) ?? { contributedSats: 0, valueSats: 0 };
          byDate.set(pt.date, {
            contributedSats: existing.contributedSats + pt.contributedSats,
            valueSats: existing.valueSats + pt.valueSats,
          });
        }
      }
      const combined: ChamaGrowthPoint[] = Array.from(byDate.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, vals]) => ({ date, ...vals }));
      setCombinedGrowth(combined);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        <p className="note">Loading portfolio…</p>
      </div>
    );
  }

  if (!portfolio || portfolio.stakes.length === 0) {
    return (
      <>
        <div className="section-head">
          <div>
            <div style={{ marginBottom: 4 }}>
              <Link href="/chama" style={{ color: "var(--soft)", fontSize: 14 }}>
                <i className="ti ti-layout-list" /> Chamas
              </Link>
            </div>
            <h1 className="page-title">My portfolio</h1>
          </div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "40px 24px" }}>
          <p className="note" style={{ marginBottom: 16 }}>You haven&apos;t joined a chama yet.</p>
          <Link href="/chama/discover">
            <button className="btn btn-primary">Discover chamas</button>
          </Link>
        </div>
      </>
    );
  }

  const gainPositive = portfolio.totalGainSats >= 0;

  return (
    <>
      <div className="section-head">
        <div>
          <div style={{ marginBottom: 4 }}>
            <Link href="/chama" style={{ color: "var(--soft)", fontSize: 14 }}>
              <i className="ti ti-layout-list" /> Chamas
            </Link>
          </div>
          <h1 className="page-title">My portfolio</h1>
          <p className="page-sub">Across {portfolio.stakes.length} chama{portfolio.stakes.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <ATMCard variant="compact"
        sats={portfolio?.totalValueSats}
        balanceLabel="PORTFOLIO VALUE"
      />

      {/* Combined totals */}
      <div className="card portfolio-totals">
        <div className="portfolio-total-grid">
          <div className="portfolio-total">
            <span className="portfolio-total-label">Total you&apos;ve put in</span>
            <span className="portfolio-total-value">{num(portfolio.totalContributedSats)} sats</span>
            <span className="portfolio-total-sub">≈ {fmtKES(portfolio.totalContributedSats, rate, 0)}</span>
          </div>
          <div className="portfolio-total">
            <span className="portfolio-total-label">Total value now</span>
            <span className="portfolio-total-value">{num(portfolio.totalValueSats)} sats</span>
            <span className="portfolio-total-sub">≈ {fmtKES(portfolio.totalValueSats, rate, 0)}</span>
          </div>
          <div className="portfolio-total">
            <span className="portfolio-total-label">Total gain</span>
            <span className={`portfolio-total-value${gainPositive ? " gain-pos" : " gain-neg"}`}>
              {gainPositive ? "+" : ""}{num(portfolio.totalGainSats)} sats
            </span>
            <span className="portfolio-total-sub">
              ≈ {gainPositive ? "+" : ""}{fmtKES(portfolio.totalGainSats, rate, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Per-chama share bars */}
      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, marginBottom: 16 }}>
          Your share per chama
        </h2>
        <div className="portfolio-chama-list">
          {portfolio.stakes.map((s) => (
            <Link key={s.chamaId} href={`/chama/${s.chamaId}`} className="portfolio-chama-row">
              <div className="portfolio-chama-head">
                <span className="portfolio-chama-name">{s.name}</span>
                <span className="portfolio-chama-pct">{s.mySharePct.toFixed(1)}%</span>
              </div>
              <div className="bar-track portfolio-bar-track">
                <div
                  className="bar-fill portfolio-bar-fill"
                  style={{ width: `${Math.min(100, s.mySharePct)}%` }}
                />
              </div>
              <div className="portfolio-chama-sub">
                Value {fmtKES(s.myValueSats, rate, 0)}
                {" · "}
                <span style={{ color: s.myGainSats >= 0 ? "var(--emerald-deep)" : "var(--red)" }}>
                  {s.myGainSats >= 0 ? "+" : ""}{fmtKES(s.myGainSats, rate, 0)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Combined growth chart — series toggle lets user switch between chamas and the aggregate */}
      {combinedGrowth.length >= 2 && (
        <div className="card" style={{ marginTop: 16 }}>
          <ChamaGrowthChart
            title="Combined growth across all chamas"
            defaultSeriesKey="all"
            currencyMode="KES"
            series={[
              // One series per chama (my value over time)
              ...portfolio.stakes
                .filter((s) => (perChamaGrowth[s.chamaId]?.length ?? 0) >= 2)
                .map((s, i) => ({
                  key: s.chamaId,
                  label: s.name,
                  color: CHAMA_COLORS[i % CHAMA_COLORS.length],
                  points: perChamaGrowth[s.chamaId].map((p) => ({
                    label: dateToLabel(p.date),
                    valueSats: p.valueSats,
                  })),
                })),
              // Aggregate total
              {
                key: "all",
                label: "All chamas",
                color: "var(--gold)",
                points: combinedGrowth.map((p) => ({
                  label: dateToLabel(p.date),
                  valueSats: p.valueSats,
                })),
              },
            ]}
          />
        </div>
      )}
    </>
  );
}
