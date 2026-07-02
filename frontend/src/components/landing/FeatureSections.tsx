"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import Button from "@/components/ui/Button";

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

/* ── The Problem — Coffee Mug Comparison ─────────────────────────────────── */

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

  // Steam wisp paths — S-curves rising from mug opening
  const s = (xp: number, dy: number) => {
    const x = +(bw * xp).toFixed(1);
    return `M${x},${st} C${+(x - 6).toFixed(1)},${+(st - st * 0.35).toFixed(1)} ${+(x + 5).toFixed(1)},${+(st * 0.2).toFixed(1)} ${x},${dy}`;
  };

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} width={vw} height={vh}>
      {/* Steam */}
      {steam && (<>
        <path className="mug-st"  d={s(0.28, 2)}    fill="none" stroke="rgba(255,255,255,.3)"  strokeWidth={lsw}      strokeLinecap="round" />
        <path className="mug-st2" d={s(0.54, 1)}    fill="none" stroke="rgba(255,255,255,.22)" strokeWidth={lsw * .8} strokeLinecap="round" />
        {size === "lg" && (
          <path className="mug-st3" d={s(0.76, 2)}  fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1.3"      strokeLinecap="round" />
        )}
      </>)}
      {/* Mug body */}
      <rect x="1" y={st} width={bw - 2} height={bh} rx={rx} ry={rx}
        fill={`rgba(${rgb},.14)`} stroke={stroke} strokeWidth={lsw} />
      {/* Handle — D-curve on right */}
      <path
        d={`M${bw - 1},${st + bh * 0.24} C${bw + hw},${st + bh * 0.24} ${bw + hw},${st + bh * 0.76} ${bw - 1},${st + bh * 0.76}`}
        fill="none" stroke={stroke} strokeWidth={lsw} strokeLinecap="round" />
      {/* Liquid surface */}
      <ellipse cx={bw / 2} cy={st + 1} rx={bw / 2 - 5}
        ry={size === "lg" ? 4.5 : size === "sm" ? 2.5 : 1.6}
        fill={`rgba(${rgb},.38)`} />
      {/* Labels */}
      {label && (
        <text x={bw / 2} y={st + bh * 0.44} textAnchor="middle" dominantBaseline="middle"
          fill="#fff" fontSize={fs} fontWeight="700" fontFamily="'IBM Plex Mono',monospace">{label}</text>
      )}
      {sub && (
        <text x={bw / 2} y={st + bh * 0.72} textAnchor="middle" dominantBaseline="middle"
          fill="rgba(255,255,255,.52)" fontSize={fs * 0.76} fontFamily="'IBM Plex Mono',monospace">{sub}</text>
      )}
    </svg>
  );
}

// Real historical BTC/KES rates (approximate year-end)
const BTC_KES: Record<number, number> = {
  2015: 30_000,
  2016: 82_000,
  2017: 1_550_000,
  2018: 355_000,
  2019: 725_000,
  2020: 3_190_000,
  2021: 7_800_000,
  2022: 1_980_000,
  2023: 5_670_000,
  2024: 12_480_000,
  2025: 13_200_000,
  2026: 7_994_000,  // current: 1 KES = 12.51 sats → BTC/KES ≈ 7,994,000
};

// KES 100 in 2015 → sats. Math.ceil ensures re-converting back gives ≥ KES 100
// so floor(cups) in 2015 = 10 (matches KES panel exactly).
const SAT_KES_2015 = BTC_KES[2015] / 100_000_000; // KES per sat ≈ 0.0003
const TOTAL_SATS   = Math.ceil(100 / SAT_KES_2015); // 333,334 sats (KES 100 at 2015 rate)

function fmtN(n: number): string {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
       : n >= 1_000     ? n.toLocaleString()
       : String(n);
}
function fmtSats(n: number): string {
  return n >= 1_000 ? `${Math.round(n / 1_000)}k` : String(Math.round(n));
}

const YEARS = [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026] as const;

// Six cups orbit: alternating KES (red) and Sats (gold) — evenly spaced over 9s period
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

        {/* Year tab nav — full width */}
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

        {/* Two-column: large orbit left, content right */}
        <div className="infl-main">

          {/* LEFT — 3-D orbit, fills available space */}
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

          {/* RIGHT — heading, compare, stats, CTA */}
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

/* ── The Solution ────────────────────────────────────────────────────────── */
function Savings() {
  const apyRef = useRef<HTMLSpanElement>(null);
  const router = useRouter();

  useEffect(() => {
    const el = apyRef.current;
    if (!el) return;
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => {
        if (e.isIntersecting) {
          animateCount(el, 52000, 1600);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="sec sec-dark" id="save">
      <div className="wrap split">
        <div className="split-visual reveal">
          <div className="balance flat">
            <div className="head">
              <span className="lbl">Locked savings · 5-year</span>
              <span className="badge"><i className="ti ti-sparkles" /> Target ~5.2% APY</span>
            </div>
            <div className="amt mn"><span ref={apyRef}>0</span> sats</div>
            <div className="conv">earned this year</div>
            <div className="qa one">
              <div className="q">
                <i className="ti ti-info-circle" /> Interest paid from real treasury
                yield — never from other savers&apos; deposits.
              </div>
            </div>
          </div>
        </div>
        <div className="reveal d1">
          <h2 className="h2">Your money earns <span className="accent">while you sleep.</span></h2>
          <p className="lead">
            Lock your sats and earn a share of real returns, distributed
            transparently every month. We take a flat 2% of the yield — nothing
            else. If the pool earns nothing, we earn nothing.
          </p>
          <div className="split-list">
            <SplitLi icon="ti-lock" title="Lock and grow" desc="Set sats aside and watch interest land each month." />
            <SplitLi icon="ti-scale" title="Honest by design" desc="Your principal is never touched for fees — ever." />
            <SplitLi icon="ti-arrow-back-up" title="Leave early if you must" desc="Your full principal always comes back to you." />
          </div>
          <div style={{ marginTop: 28 }}>
            <Button variant="gold" onClick={() => router.push("/register?redirect=/savings")}>
              Start saving today <i className="ti ti-arrow-right" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── M-Pesa ──────────────────────────────────────────────────────────────── */
function Mpesa() {
  const router = useRouter();
  const rate = useRate();
  const sats = Math.round(500 * rate.satsPerKes);
  return (
    <section className="sec" id="mpesa">
      <div className="wrap split flip">
        <div className="split-visual reveal">
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
                <div><div className="t">Deposit confirmed</div><div className="s">Balance updated instantly</div></div>
              </div>
            </div>
          </div>
        </div>
        <div className="reveal d1">
          <h2 className="h2">Top up the way you <span className="accent">already pay.</span></h2>
          <p className="lead">
            Deposit and withdraw in shillings through the M-Pesa network 51 million
            Kenyans already use. No new app habits, no cards — just an STK Push and
            a PIN you already know.
          </p>
          <div className="split-list">
            <SplitLi icon="ti-arrow-down" title="Deposit in seconds" desc="A prompt on your phone, your PIN, done." />
            <SplitLi icon="ti-arrow-up" title="Cash out to your line" desc="Send shillings straight back to M-Pesa." />
          </div>
          <div style={{ marginTop: 28 }}>
            <Button variant="gold" onClick={() => router.push("/register?redirect=/deposit")}>
              Deposit via M-Pesa <i className="ti ti-arrow-right" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Chama ───────────────────────────────────────────────────────────────── */
function Chama() {
  const router = useRouter();
  const nodes = [
    { s: 84, l: "calc(50% - 42px)", t: "calc(50% - 42px)", txt: "Chama", hub: true, d: 0 },
    { s: 52, l: "10%", t: "14%", txt: "+5k", d: 0.1 },
    { s: 46, l: "78%", t: "10%", txt: "+3k", d: 0.18 },
    { s: 58, l: "80%", t: "54%", txt: "+8k", d: 0.26 },
    { s: 48, l: "55%", t: "78%", txt: "+2k", d: 0.34 },
    { s: 54, l: "12%", t: "66%", txt: "+4k", d: 0.42 },
    { s: 42, l: "30%", t: "82%", txt: "+1k", d: 0.5 },
  ];
  const lines = [
    ["14%", "20%"], ["82%", "16%"], ["86%", "60%"],
    ["60%", "84%"], ["18%", "72%"], ["34%", "88%"],
  ];
  return (
    <section className="sec sec-cream" id="chama">
      <div className="wrap split">
        <div className="split-visual reveal">
          <div className="nodes">
            <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }} aria-hidden="true">
              {lines.map(([x, y], i) => (
                <line key={i} className="node-line" x1="50%" y1="50%" x2={x} y2={y} />
              ))}
            </svg>
            {nodes.map((n, i) => (
              <div
                key={i}
                className={`node${n.hub ? " hub" : ""}`}
                style={{ width: n.s, height: n.s, left: n.l, top: n.t, transitionDelay: `${n.d}s` }}
              >
                {n.txt}
              </div>
            ))}
          </div>
        </div>
        <div className="reveal d1">
          <h2 className="h2">Save together.<br /><span className="grow">See everything.</span></h2>
          <p className="lead">
            Run your chama with a shared wallet and a transparent ledger every
            member can read for themselves. The savings tradition you already
            trust — now it can&apos;t be raided, and it doesn&apos;t lose value.
          </p>
          <div className="split-list">
            <SplitLi icon="ti-eye" title="Open books" desc="Every contribution and payout is visible to all members." />
            <SplitLi icon="ti-checkbox" title="Group decisions" desc="Payouts move only when the group agrees." />
          </div>
          <div style={{ marginTop: 28 }}>
            <Button variant="gold" onClick={() => router.push("/register?redirect=/chama")}>
              Start or join a chama <i className="ti ti-arrow-right" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Agents ──────────────────────────────────────────────────────────────── */
function Agents() {
  const router = useRouter();
  const pins = [
    { l: "46%", t: "44%", lab: "You", ic: "ti-building-store", d: 0.05 },
    { l: "20%", t: "24%", lab: "Gikomba", ic: "ti-map-pin", d: 0.15 },
    { l: "72%", t: "28%", lab: "Kibera", ic: "ti-map-pin", d: 0.25 },
    { l: "76%", t: "66%", lab: "Kondele", ic: "ti-map-pin", d: 0.35 },
    { l: "24%", t: "70%", lab: "Mombasa Rd", ic: "ti-map-pin", d: 0.45 },
  ];
  return (
    <section className="sec" id="agents">
      <div className="wrap split flip">
        <div className="split-visual reveal">
          <div className="map">
            {[140, 240, 340].map((d) => (
              <div key={d} className="ring" style={{ width: d, height: d, left: `calc(50% - ${d / 2}px)`, top: `calc(50% - ${d / 2}px)` }} />
            ))}
            {pins.map((p, i) => (
              <div key={i} className="pin" style={{ left: p.l, top: p.t, transitionDelay: `${p.d}s` }}>
                <i className={`ti ${p.ic}`} />
                <span className="lab">{p.lab}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="reveal d1">
          <h2 className="h2">Cash in and out, <span className="accent">down the street.</span></h2>
          <p className="lead">
            No smartphone or bundles? Walk to a neighbourhood agent — a shop you
            already know — to turn cash into savings and savings back into cash.
            Agents earn a small commission for serving their community.
          </p>
          <div className="split-list">
            <SplitLi icon="ti-walk" title="Always nearby" desc="A growing network of mawakala across Kenya." />
            <SplitLi icon="ti-heart-handshake" title="Community first" desc="Local agents, local trust, local livelihoods." />
          </div>
          <div style={{ marginTop: 28 }}>
            <Button variant="gold" onClick={() => router.push("/register?redirect=/agent")}>
              Find an agent <i className="ti ti-arrow-right" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

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
