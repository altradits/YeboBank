"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import Button from "@/components/ui/Button";
import { KENYA_COUNTIES, KENYA_CITIES } from "@/lib/kenya-counties";

export default function FeatureSections() {
  return (
    <>
      <Inflation />
      <Savings />
      <Mpesa />
      <Chama />
      <Agents />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   INFLATION — The Problem (unchanged — reference design)
   ══════════════════════════════════════════════════════════════════════════ */

type MugSize = "lg" | "sm" | "xs";
const MUG_D: Record<MugSize, { bw: number; bh: number; st: number; hw: number }> = {
  lg: { bw: 78, bh: 84, st: 30, hw: 22 },
  sm: { bw: 40, bh: 46, st: 16, hw: 12 },
  xs: { bw: 26, bh: 30, st: 11, hw: 8  },
};

function MugSVG({
  size = "sm", rgb, stroke, label, sub, steam = true,
}: {
  size?: MugSize; rgb: string; stroke: string;
  label?: string; sub?: string; steam?: boolean;
}) {
  const { bw, bh, st, hw } = MUG_D[size];
  const vw = bw + hw + 3;
  const vh = st + bh + 2;
  const rx  = size === "lg" ? 9 : size === "sm" ? 5 : 3;
  const lsw = size === "lg" ? 2 : 1.5;
  const fs  = size === "lg" ? 11 : size === "sm" ? 7.5 : 5.5;

  const s = (xp: number, dy: number) => {
    const x = +(bw * xp).toFixed(1);
    return `M${x},${st} C${+(x - 6).toFixed(1)},${+(st - st * 0.35).toFixed(1)} ${+(x + 5).toFixed(1)},${+(st * 0.2).toFixed(1)} ${x},${dy}`;
  };

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} width={vw} height={vh}>
      {steam && (<>
        <path className="mug-st"  d={s(0.28, 2)}    fill="none" stroke="rgba(255,255,255,.3)"  strokeWidth={lsw}      strokeLinecap="round" />
        <path className="mug-st2" d={s(0.54, 1)}    fill="none" stroke="rgba(255,255,255,.22)" strokeWidth={lsw * .8} strokeLinecap="round" />
        {size === "lg" && (
          <path className="mug-st3" d={s(0.76, 2)}  fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1.3"      strokeLinecap="round" />
        )}
      </>)}
      <rect x="1" y={st} width={bw - 2} height={bh} rx={rx} ry={rx}
        fill={`rgba(${rgb},.14)`} stroke={stroke} strokeWidth={lsw} />
      <path
        d={`M${bw - 1},${st + bh * 0.24} C${bw + hw},${st + bh * 0.24} ${bw + hw},${st + bh * 0.76} ${bw - 1},${st + bh * 0.76}`}
        fill="none" stroke={stroke} strokeWidth={lsw} strokeLinecap="round" />
      <ellipse cx={bw / 2} cy={st + 1} rx={bw / 2 - 5}
        ry={size === "lg" ? 4.5 : size === "sm" ? 2.5 : 1.6}
        fill={`rgba(${rgb},.38)`} />
      {label && (
        <text x={bw / 2} y={st + bh * 0.44} textAnchor="middle" dominantBaseline="middle"
          fill="#fff" fontSize={fs} fontWeight="700" fontFamily="'JetBrains Mono',monospace">{label}</text>
      )}
      {sub && (
        <text x={bw / 2} y={st + bh * 0.72} textAnchor="middle" dominantBaseline="middle"
          fill="rgba(255,255,255,.52)" fontSize={fs * 0.76} fontFamily="'JetBrains Mono',monospace">{sub}</text>
      )}
    </svg>
  );
}

const BTC_KES: Record<number, number> = {
  2015: 30_000,  2016: 82_000,   2017: 1_550_000, 2018: 355_000,
  2019: 725_000, 2020: 3_190_000, 2021: 7_800_000, 2022: 1_980_000,
  2023: 5_670_000, 2024: 12_480_000, 2025: 13_200_000, 2026: 7_994_000,
};

const SAT_KES_2015 = BTC_KES[2015] / 100_000_000;
const TOTAL_SATS   = Math.ceil(100 / SAT_KES_2015);

function fmtN(n: number): string {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
       : n >= 1_000     ? n.toLocaleString()
       : String(n);
}
function fmtSats(n: number): string {
  return n >= 1_000 ? `${Math.round(n / 1_000)}k` : String(Math.round(n));
}

const YEARS = [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026] as const;

const ORBIT_CUPS = [
  { type: "kes" as const, delay: "0s",    vy: -38 },
  { type: "sat" as const, delay: "-1.5s", vy:  32 },
  { type: "kes" as const, delay: "-3s",   vy:  -8 },
  { type: "sat" as const, delay: "-4.5s", vy: -28 },
  { type: "kes" as const, delay: "-6s",   vy:  42 },
  { type: "sat" as const, delay: "-7.5s", vy:  16 },
] as const;

function Inflation() {
  const router   = useRouter();
  const secRef   = useRef<HTMLElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [year, setYear]     = useState(2015);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = secRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setActive(true); io.disconnect(); } },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const runFrom = (startY: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    let y = startY;
    setYear(y);
    const tick = () => {
      if (y < 2026) {
        y++;
        setYear(y);
        timerRef.current = setTimeout(tick, 900);
      } else {
        timerRef.current = setTimeout(() => {
          y = 2015;
          setYear(2015);
          timerRef.current = setTimeout(tick, 1000);
        }, 3000);
      }
    };
    timerRef.current = setTimeout(tick, 900);
  };

  useEffect(() => {
    if (!active) return;
    runFrom(2015);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  const n          = year - 2015;
  const chaiKES    = Math.round(10 + 10 * (n / 11));
  const kesCups    = Math.floor(100 / chaiKES);
  const satKes     = (BTC_KES[year] ?? BTC_KES[2026]) / 100_000_000;
  const kesValue   = TOTAL_SATS * satKes;
  const satCups    = Math.floor(kesValue / chaiKES);
  const satsPerCup = Math.round(chaiKES / satKes);
  const kesAlpha   = Math.max(0.3, kesCups / 10);
  const satAlpha   = Math.min(1, 0.35 + (Math.min(satCups, 1332) / 1332) * 0.65);

  return (
    <section className="sec" id="inflation" ref={secRef}>
      <div className="wrap">
        <div className="io-year-nav reveal">
          {YEARS.map(y => (
            <button
              key={y}
              className={`io-yr-tab${year === y ? " active" : ""}`}
              onClick={() => runFrom(y)}
            >
              {y}
            </button>
          ))}
        </div>

        <div className="infl-main">
          <div className="infl-orbit-panel reveal d1">
            <div className="io-viewport">
              <div className="io-system">
                <div className="io-center">
                  <div className="io-center-body">
                    <div className="io-c-year">{year}</div>
                    <div className="io-c-hr" />
                    <div className="io-c-row io-c-kes">
                      <span>KES 100</span>
                      <span className="io-c-val">{kesCups} cups</span>
                    </div>
                    <div className="io-c-row io-c-sat">
                      <span>333k sats</span>
                      <span className="io-c-val">{fmtN(satCups)} cups</span>
                    </div>
                    <div className="io-c-rate">1 cup = {fmtSats(satsPerCup)} sats</div>
                  </div>
                </div>

                {ORBIT_CUPS.map((cup, i) => (
                  <div key={i} className="io-track" style={{ animationDelay: cup.delay }}>
                    <div
                      className={`io-cup io-cup-${cup.type}`}
                      style={{
                        marginTop: cup.vy,
                        animationDelay: cup.delay,
                        opacity: cup.type === "kes" ? kesAlpha : satAlpha,
                      }}
                    >
                      <span className="io-cup-emoji">☕</span>
                      <span className="io-cup-price">
                        {cup.type === "kes" ? `KES ${chaiKES}` : `${fmtSats(satsPerCup)} sats`}
                      </span>
                      <span className="io-cup-sub">per cup</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="infl-side reveal d2">
            <div>
              <h2 className="h2">
                KES loses buying power.<br />
                <span className="gold">Sats hold it.</span>
              </h2>
              <p className="lead">
                KES 100 saved in sats in 2015 is worth{" "}
                <strong className="gold">KES 26,645</strong> today —{" "}
                <strong className="gold">1,332 cups</strong> instead of 5.
              </p>
            </div>

            <div className="io-compare">
              <div className="io-cmp-side">
                <div className="io-cmp-label">KES 100 buys</div>
                <div className="io-cmp-cups io-cups-kes">{kesCups}</div>
                <div className="io-cmp-sub">cups · KES {chaiKES} each</div>
                <div className="io-cmp-badge io-badge-kes">
                  {n === 0 ? "baseline" : `−${Math.round((1 - kesCups / 10) * 100)}% power`}
                </div>
              </div>
              <div className="io-cmp-mid"><div className="io-cmp-vs">vs</div></div>
              <div className="io-cmp-side">
                <div className="io-cmp-label">333,334 sats buys</div>
                <div className="io-cmp-cups io-cups-sat">{fmtN(satCups)}</div>
                <div className="io-cmp-sub">cups · {fmtSats(satsPerCup)} sats each</div>
                <div className="io-cmp-badge io-badge-sat">= KES {fmtN(Math.round(kesValue))}</div>
              </div>
            </div>

            <div className="infl-stats">
              <div className="infl-stat">
                <div className="infl-stat-num gold">266×</div>
                <div className="infl-stat-label">more purchasing power</div>
              </div>
              <div className="infl-stat-div" />
              <div className="infl-stat">
                <div className="infl-stat-num gold">1,332</div>
                <div className="infl-stat-label">cups from 333k sats</div>
              </div>
              <div className="infl-stat-div" />
              <div className="infl-stat">
                <div className="infl-stat-num gold">KES 26,645</div>
                <div className="infl-stat-label">value of KES 100 in sats</div>
              </div>
            </div>

            <div className="infl-cta">
              <Button variant="gold" onClick={() => router.push("/register")}>
                Protect my savings with sats <i className="ti ti-arrow-right" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SAVINGS — one number, one choice: pick a term, see what a lock earns
   (BRANDKIT §9: no decorative drawings; §4.3: money in mono)
   ══════════════════════════════════════════════════════════════════════════ */

const TERMS = [
  { yr: 5,  label: "5 years",  sats: 52_000,  apy: "~5.2% APY" },
  { yr: 7,  label: "7 years",  sats: 78_000,  apy: "~5.4% APY" },
  { yr: 10, label: "10 years", sats: 124_000, apy: "~5.8% APY" },
] as const;

function Savings() {
  const router     = useRouter();
  const numRef     = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [term, setTerm]       = useState(0);
  const [visible, setVisible] = useState(false);
  const targetSats = TERMS[term].sats;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !numRef.current) return;
    animateCount(numRef.current, targetSats, 1400);
  }, [visible, targetSats]);

  return (
    <section className="sec" id="save" ref={sectionRef}>
      <div className="wrap">
        <div className="savings-layout">

          {/* LEFT — the earnings card: pick a term, see the number */}
          <div className="save-card reveal" role="img"
            aria-label="What a locked savings account earns: pick a term, see sats earned per year">
            <div className="save-card-head">
              <span className="l"><i className="ti ti-lock" /> LOCKED SAVINGS</span>
              <span className="save-card-badge">PAID MONTHLY</span>
            </div>

            <div className="save-card-earn">
              <div className="save-card-num"><span ref={numRef}>0</span></div>
              <div className="save-card-unit">sats earned per year</div>
              <div className="save-card-sub">on a 1,000,000-sat lock · {TERMS[term].apy}</div>
            </div>

            {/* Term picker */}
            <div className="vault-terms">
              {TERMS.map((t, i) => (
                <button
                  key={i}
                  className={`vault-term${term === i ? " active" : ""}`}
                  onClick={() => setTerm(i)}
                  aria-pressed={term === i}
                >
                  <div className="vault-term-yr">{t.yr}<span>yr</span></div>
                  <div className="vault-term-apy">{t.apy}</div>
                </button>
              ))}
            </div>

            <div className="save-card-foot">
              <div><i className="ti ti-shield-check" /> Principal never touched for fees</div>
              <div><i className="ti ti-arrow-back-up" /> Leave early — full principal back</div>
            </div>
          </div>

          {/* RIGHT — copy */}
          <div className="reveal d1">
            <div className="kicker"><i className="ti ti-lock" /> Locked savings</div>
            <h2 className="h2">Your money earns <span className="accent">while you sleep.</span></h2>
            <p className="lead">
              Lock your sats and earn a share of real treasury yield, distributed
              every month. We take a flat 2% of the yield — nothing else. If the
              pool earns nothing, we earn nothing.
            </p>
            <div className="split-list">
              <SplitLi icon="ti-lock"          title="Set it and forget it" desc="Choose a term, lock your sats, let compound interest run." />
              <SplitLi icon="ti-scale"          title="Honest by design"    desc="Your principal is never touched for fees — ever." />
              <SplitLi icon="ti-arrow-back-up"  title="Leave early if needed" desc="Your full principal comes back to you, no questions asked." />
            </div>
            <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button variant="gold" onClick={() => router.push("/register?redirect=/savings")}>
                Start saving today <i className="ti ti-arrow-right" />
              </Button>
              <Button variant="ghost" onDark onClick={() => router.push("/dashboard")}>
                See demo
              </Button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   M-PESA — "The Bridge": 3D-tilt phone + animated flow
   ══════════════════════════════════════════════════════════════════════════ */

function Mpesa() {
  const router  = useRouter();
  const rate    = useRate();
  const sats    = Math.round(500 * rate.satsPerKes);
  const visRef  = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const el = visRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5);
      const y = ((e.clientY - rect.top) / rect.height - 0.5);
      el.style.setProperty("--mx", String(x));
      el.style.setProperty("--my", String(y));
    };
    const onLeave = () => {
      el.style.setProperty("--mx", "0");
      el.style.setProperty("--my", "0");
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <section className="sec" id="mpesa">
      <div className="wrap">
        <div className="mpesa-layout">

          {/* LEFT — visual: 3D phone + flow line + wallet */}
          <div
            className="mpesa-visual"
            ref={visRef}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <div className="mpesa-phone-3d">
              <div className="phone">
                <div className="scr">
                  <div className="ph-top">M-PESA <span>STK Push</span></div>
                  <div className="mp-card">
                    <div className="mp-row"><span>Pay to</span><b>YeboBank</b></div>
                    <div className="mp-row"><span>Amount</span><b>KES 500.00</b></div>
                    <div className="mp-row"><span>You receive</span><b className="grn">≈ {num(sats)} sats</b></div>
                    <div className="mp-btn">Enter PIN to confirm</div>
                  </div>
                  <div className="mp-ok">
                    <i className="ti ti-circle-check" />
                    <div>
                      <div className="t">Deposit confirmed</div>
                      <div className="s">Balance updated instantly</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Animated flow SVG */}
            <svg className="mpesa-flow-svg" viewBox="0 0 268 60" aria-hidden="true" style={{ width: 268, height: 60 }}>
              <path
                className={`mpesa-flow-path${hovered ? " fast" : ""}`}
                d="M 134 4 C 80 4 40 56 134 56 C 228 56 188 4 134 4"
              />
              <circle r="4" fill="var(--lime)" opacity=".9">
                <animateMotion dur={hovered ? "0.6s" : "1.4s"} repeatCount="indefinite"
                  path="M 134 4 C 80 4 40 56 134 56 C 228 56 188 4 134 4" />
              </circle>
            </svg>

            {/* Destination wallet */}
            <div className="mpesa-wallet-card">
              <div className="mpesa-wallet-icon"><i className="ti ti-wallet" /></div>
              <div>
                <div className="mpesa-wallet-text">Your YeboBank wallet</div>
                <div className="mpesa-wallet-val">+{num(sats)} sats</div>
              </div>
            </div>
          </div>

          {/* RIGHT — copy */}
          <div className="reveal d1">
            <div className="kicker"><i className="ti ti-device-mobile" /> M-Pesa integration</div>
            <h2 className="h2">Top up the way you <span className="grow">already pay.</span></h2>
            <p className="lead">
              Deposit and withdraw in shillings through the M-Pesa network
              51 million Kenyans already use. No new habits, no cards —
              just an STK Push and a PIN you already know.
            </p>
            <div className="split-list">
              <SplitLi icon="ti-arrow-down" title="Deposit in seconds"   desc="A prompt on your phone, your PIN, done. Sats land instantly." />
              <SplitLi icon="ti-arrow-up"   title="Cash out to M-Pesa"  desc="Withdraw shillings straight back to your M-Pesa line." />
              <SplitLi icon="ti-shield"     title="No new app to learn"  desc="The same STK Push you've used a thousand times." />
            </div>
            <div style={{ marginTop: 32 }}>
              <Button variant="gold" onClick={() => router.push("/register?redirect=/deposit")}>
                Deposit via M-Pesa <i className="ti ti-arrow-right" />
              </Button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   CHAMA — the shared ledger, shown as it really is (BRANDKIT §7.2: a card is
   one idea; §9: charts minimal, one accent series; mono digits per §4.3)
   ══════════════════════════════════════════════════════════════════════════ */

const LEDGER_MEMBERS = [
  { initial: "W", name: "Wanjiku", amount: "15,000", pct: 100 },
  { initial: "A", name: "Aisha",   amount: "12,000", pct: 80  },
  { initial: "N", name: "Nafula",  amount: "11,400", pct: 76  },
  { initial: "O", name: "Otieno",  amount: "9,200",  pct: 61  },
  { initial: "K", name: "Kamau",   amount: "8,500",  pct: 57  },
] as const;

function Chama() {
  const router = useRouter();

  return (
    <section className="sec" id="chama">
      <div className="wrap">
        <div className="chama-layout">

          {/* LEFT — the shared ledger card, exactly as members see it */}
          <div className="chama-ledger reveal" role="img"
            aria-label="A chama's shared ledger: group pool balance, each member's contribution, and an open vote">
            <div className="chama-ledger-head">
              <div>
                <div className="chama-ledger-title">Mama Mboga Chama</div>
                <div className="chama-ledger-sub">6 members · every entry visible to all</div>
              </div>
              <span className="chama-ledger-badge">OPEN BOOKS</span>
            </div>

            <div className="chama-ledger-pool">
              <span className="l">GROUP POOL</span>
              <span className="v">KES 63,900</span>
              <span className="s">≈ 505,100 sats · held in Bitcoin</span>
            </div>

            <div className="chama-ledger-rows">
              {LEDGER_MEMBERS.map((m, i) => (
                <div key={m.name} className={`chama-ledger-row reveal d${Math.min(i + 1, 3)}`}>
                  <span className="av">{m.initial}</span>
                  <span className="nm">{m.name}</span>
                  <span className="bar"><span style={{ width: `${m.pct}%` }} /></span>
                  <span className="amt">KES {m.amount}</span>
                </div>
              ))}
            </div>

            <div className="chama-ledger-vote">
              <i className="ti ti-checkbox" />
              <div>
                <div className="q">Raise monthly contribution to KES 3,000?</div>
                <div className="t">4 of 6 votes · payouts move only when the group agrees</div>
              </div>
              <span className="chama-ledger-pending">VOTING</span>
            </div>
          </div>

          {/* RIGHT — copy */}
          <div className="reveal d1">
            <div className="kicker"><i className="ti ti-users" /> Group savings</div>
            <h2 className="h2">Save together.<br /><span className="grow">See everything.</span></h2>
            <p className="lead">
              Run your chama with a shared wallet every member can read.
              The savings tradition you already trust — now it can&apos;t be raided,
              and it doesn&apos;t lose value to inflation.
            </p>
            <div className="split-list">
              <SplitLi icon="ti-eye"       title="Open books"       desc="Every contribution and payout visible to all members." />
              <SplitLi icon="ti-checkbox"  title="Group decisions"  desc="Payouts move only when the group votes to release them." />
              <SplitLi icon="ti-trending-up" title="Sats, not KES"  desc="The group pool holds value instead of shrinking to inflation." />
            </div>
            <div style={{ marginTop: 32 }}>
              <Button variant="gold" onClick={() => router.push("/register?redirect=/chama")}>
                Start or join a chama <i className="ti ti-arrow-right" />
              </Button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   AGENTS — real Kenya county map (geoBoundaries ADM1) with agent coverage
   ══════════════════════════════════════════════════════════════════════════ */

const MAP_W = 440;
const MAP_H = 557.7;

// Great-circle distance, good enough to rank nearest agent hubs.
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function Agents() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [nearest, setNearest] = useState<{ label: string; n: number; km: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const selectedCounty = KENYA_COUNTIES.find((c) => c.name === selected) ?? null;

  function findNearMe() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Location isn't available in this browser — tap your county on the map instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const ranked = KENYA_CITIES
          .map((c) => ({ label: c.label, n: c.n, km: haversineKm(latitude, longitude, c.lat, c.lon) }))
          .sort((a, b) => a.km - b.km);
        setNearest(ranked[0]);
        setLocating(false);
      },
      () => {
        setGeoError("Couldn't get your location — tap your county on the map instead.");
        setLocating(false);
      },
      { timeout: 8000 },
    );
  }

  return (
    <section className="sec" id="agents">
      <div className="wrap">
        <div className="agents-layout">

          {/* LEFT — Kenya, all 47 counties, drawn from real boundary data */}
          <div className="kenya-map-wrap reveal">
            <svg className="kenya-svg" viewBox={`0 0 ${MAP_W} ${MAP_H}`} role="img"
              aria-label="Map of Kenya's 47 counties showing YeboBank agent coverage">
              {/* Counties — tap one to see its agent coverage */}
              {KENYA_COUNTIES.map((c) => (
                <path key={c.name} d={c.d}
                  className={`kenya-county${selected === c.name ? " on" : ""}`}
                  onClick={() => setSelected(selected === c.name ? null : c.name)}
                >
                  <title>{`${c.name} — ${c.agents} agents`}</title>
                </path>
              ))}

              {/* Static city dots (SVG — drawn below HTML rings) */}
              {KENYA_CITIES.map((a, i) => (
                <g key={i} pointerEvents="none">
                  <circle cx={a.x} cy={a.y} r={a.capital ? 8 : 5.5}
                    fill={a.capital ? "rgba(196,144,32,.9)" : "rgba(17,166,91,.88)"}/>
                  <circle cx={a.x} cy={a.y} r={a.capital ? 3.5 : 2}
                    fill="rgba(255,255,255,.55)"/>
                </g>
              ))}
            </svg>

            {/* HTML dots — pulse rings + tooltips */}
            {KENYA_CITIES.map((a, i) => (
              <div
                key={i}
                className={`kenya-dot${a.capital ? " kenya-dot--capital" : ""}${nearest?.label === a.label ? " kenya-dot--nearest" : ""}`}
                style={{ left: `${(a.x / MAP_W) * 100}%`, top: `${(a.y / MAP_H) * 100}%` }}
              >
                <div className="kenya-ring" style={{ animationDelay: a.delay }} />
                <div className="kenya-tip">
                  <b>{a.label}</b><br />{a.n} agents
                </div>
              </div>
            ))}

            {/* Selection / nearest readout */}
            {(selectedCounty || nearest || geoError) && (
              <div className="kenya-readout">
                {geoError ? (
                  <span>{geoError}</span>
                ) : nearest ? (
                  <span><b>{nearest.label}</b> is your nearest hub — {nearest.n} agents, ≈{Math.round(nearest.km)} km away</span>
                ) : selectedCounty ? (
                  <span><b>{selectedCounty.name}</b> county — {selectedCounty.agents} YeboBank agents</span>
                ) : null}
              </div>
            )}
          </div>

          {/* RIGHT — copy */}
          <div className="reveal d1">
            <div className="agents-stats">
              <div className="agents-stat">
                <div className="agents-stat-n">340+</div>
                <div className="agents-stat-l">Locations</div>
              </div>
              <div className="agents-stat">
                <div className="agents-stat-n">47</div>
                <div className="agents-stat-l">Counties</div>
              </div>
              <div className="agents-stat">
                <div className="agents-stat-n">24/7</div>
                <div className="agents-stat-l">Available</div>
              </div>
            </div>
            <div className="kicker"><i className="ti ti-map-pin" /> Agent network</div>
            <h2 className="h2">Cash in and out, <span className="accent">down the street.</span></h2>
            <p className="lead">
              No smartphone? No bundles? Walk to a neighbourhood agent — a shop
              you already know — to turn cash into savings and savings back into
              cash. Agents earn commission for serving their community.
            </p>
            <div className="split-list">
              <SplitLi icon="ti-walk"             title="Always nearby"     desc="A growing network of mawakala covering every county." />
              <SplitLi icon="ti-heart-handshake"  title="Community first"   desc="Local agents, local trust, local livelihoods." />
              <SplitLi icon="ti-cash"             title="No internet needed" desc="Agents bridge the digital gap — cash works everywhere." />
            </div>
            <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button variant="gold" onClick={findNearMe} disabled={locating}>
                <i className="ti ti-current-location" /> {locating ? "Locating…" : "Find agents near me"}
              </Button>
              <Button variant="ghost" onClick={() => router.push("/register?redirect=/agent")}>
                Become an agent <i className="ti ti-arrow-right" />
              </Button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/* ── Shared ────────────────────────────────────────────────────────────── */

function SplitLi({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="split-li">
      <i className={`ti ${icon}`} />
      <div>
        <div className="ti-tt">{title}</div>
        <div className="ti-dd">{desc}</div>
      </div>
    </div>
  );
}

function animateCount(el: HTMLElement, target: number, dur: number) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = target.toLocaleString();
    return;
  }
  let start: number | null = null;
  const tick = (ts: number) => {
    if (start === null) start = ts;
    const p = Math.min((ts - start) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * e).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
