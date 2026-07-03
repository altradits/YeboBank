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
          fill="#fff" fontSize={fs} fontWeight="700" fontFamily="'IBM Plex Mono',monospace">{label}</text>
      )}
      {sub && (
        <text x={bw / 2} y={st + bh * 0.72} textAnchor="middle" dominantBaseline="middle"
          fill="rgba(255,255,255,.52)" fontSize={fs * 0.76} fontFamily="'IBM Plex Mono',monospace">{sub}</text>
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
   SAVINGS — "The Vault": animated dial, interactive term picker
   ══════════════════════════════════════════════════════════════════════════ */

const TERMS = [
  { yr: 5,  label: "5 years",  sats: 52_000,  apy: "~5.2% APY" },
  { yr: 7,  label: "7 years",  sats: 78_000,  apy: "~5.4% APY" },
  { yr: 10, label: "10 years", sats: 124_000, apy: "~5.8% APY" },
] as const;

const TICK_COUNT = 36;

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

          {/* LEFT — combination vault lock */}
          <div className="vault-scene reveal">
            <svg className="vault-svg" viewBox="0 0 440 440" aria-hidden="true">
              <defs>
                <radialGradient id="vbg" cx="48%" cy="42%" r="54%">
                  <stop offset="0%" stopColor="#1C1008"/>
                  <stop offset="100%" stopColor="#050302"/>
                </radialGradient>
                <radialGradient id="vface" cx="40%" cy="35%" r="60%">
                  <stop offset="0%" stopColor="#261A0A"/>
                  <stop offset="100%" stopColor="#0E0906"/>
                </radialGradient>
                <linearGradient id="vbolt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E0C840"/>
                  <stop offset="100%" stopColor="#8C6010"/>
                </linearGradient>
                <radialGradient id="vdial" cx="50%" cy="40%" r="50%">
                  <stop offset="0%" stopColor="#1A1208"/>
                  <stop offset="100%" stopColor="#080604"/>
                </radialGradient>
              </defs>

              {/* Vault body — solid filled circle, no CSS border */}
              <circle cx="220" cy="220" r="208" fill="url(#vbg)"/>
              {/* Outer rim (SVG stroke, not CSS border-width) */}
              <circle cx="220" cy="220" r="204" fill="none" stroke="rgba(196,144,32,.22)" strokeWidth="4"/>

              {/* Door face */}
              <circle cx="220" cy="220" r="180" fill="url(#vface)"/>
              {/* Concentric door ridges (detailing) */}
              <circle cx="220" cy="220" r="176" fill="none" stroke="rgba(196,144,32,.34)" strokeWidth="3"/>
              <circle cx="220" cy="220" r="158" fill="none" stroke="rgba(196,144,32,.16)" strokeWidth="1.5"/>
              <circle cx="220" cy="220" r="136" fill="none" stroke="rgba(196,144,32,.09)" strokeWidth="1"/>

              {/* LOCKING BOLTS — N, S, E, W — extend from door edge into outer rim */}
              {/* North */}
              <rect x="211" y="12" width="18" height="28" rx="6" fill="url(#vbolt)"/>
              <rect x="214.5" y="15" width="11" height="3.5" rx="2" fill="rgba(255,255,255,.28)"/>
              {/* South */}
              <rect x="211" y="400" width="18" height="28" rx="6" fill="url(#vbolt)"/>
              <rect x="214.5" y="421.5" width="11" height="3.5" rx="2" fill="rgba(255,255,255,.28)"/>
              {/* East */}
              <rect x="400" y="211" width="28" height="18" rx="6" fill="url(#vbolt)"/>
              <rect x="421.5" y="214.5" width="3.5" height="11" rx="2" fill="rgba(255,255,255,.28)"/>
              {/* West */}
              <rect x="12" y="211" width="28" height="18" rx="6" fill="url(#vbolt)"/>
              <rect x="15" y="214.5" width="3.5" height="11" rx="2" fill="rgba(255,255,255,.28)"/>

              {/* Combination dial — slowly rotates */}
              <g className="vault-dial-spin" style={{ transformOrigin: "220px 220px" }}>
                <circle cx="220" cy="220" r="92" fill="url(#vdial)"/>
                <circle cx="220" cy="220" r="88" fill="none" stroke="rgba(196,144,32,.42)" strokeWidth="2.5"/>
                {/* Tick marks around dial */}
                {Array.from({ length: 40 }).map((_, i) => {
                  const angle = (i * 9 * Math.PI) / 180;
                  const isMajor = i % 5 === 0;
                  const r1 = isMajor ? 71 : 78;
                  return (
                    <line key={i}
                      x1={220 + r1 * Math.cos(angle)}     y1={220 + r1 * Math.sin(angle)}
                      x2={220 + 86  * Math.cos(angle)}     y2={220 + 86  * Math.sin(angle)}
                      stroke={isMajor ? "rgba(196,144,32,.62)" : "rgba(196,144,32,.25)"}
                      strokeWidth={isMajor ? 1.8 : 0.9}
                    />
                  );
                })}
              </g>

              {/* Fixed indicator arrow — outside the spinning group */}
              <polygon points="220,127 215.5,143 224.5,143" fill="rgba(224,168,0,.95)"/>

              {/* Dial center knob */}
              <circle cx="220" cy="220" r="15" fill="rgba(196,144,32,.6)"/>
              <circle cx="220" cy="220" r="8"  fill="rgba(255,255,255,.18)"/>
              <circle cx="220" cy="220" r="3"  fill="rgba(255,255,255,.45)"/>
            </svg>

            {/* Animated sats counter — HTML overlay centred on the dial */}
            <div className="vault-center-overlay">
              <div className="vault-num" ref={numRef}>0</div>
              <div className="vault-unit">sats</div>
              <div className="vault-sub">earned / year</div>
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
   CHAMA — "The Circle": mouse-magnet member nodes
   ══════════════════════════════════════════════════════════════════════════ */

const MEMBERS = [
  { name: "Wanjiku", initial: "W", contrib: "KES 12,000", color: "#C49020", bg: "rgba(196,144,32,.22)", angle: 0   },
  { name: "Kamau",   initial: "K", contrib: "KES  8,500", color: "#96C244", bg: "rgba(150,194,68,.2)",  angle: 60  },
  { name: "Aisha",   initial: "A", contrib: "KES 15,000", color: "#C49020", bg: "rgba(196,144,32,.22)", angle: 120 },
  { name: "Otieno",  initial: "O", contrib: "KES  9,200", color: "#96C244", bg: "rgba(150,194,68,.2)",  angle: 180 },
  { name: "Nafula",  initial: "N", contrib: "KES 11,400", color: "#C49020", bg: "rgba(196,144,32,.22)", angle: 240 },
  { name: "Mwenda",  initial: "M", contrib: "KES  7,800", color: "#96C244", bg: "rgba(150,194,68,.2)",  angle: 300 },
] as const;

const RADIUS = 115;

function Chama() {
  const router     = useRouter();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sec = sectionRef.current;
    if (!sec) return;

    const members = sec.querySelectorAll<HTMLElement>(".chama-member");

    const onMove = (e: MouseEvent) => {
      const rect = sec.getBoundingClientRect();
      const cx   = rect.left + rect.width / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) / rect.width;
      const dy   = (e.clientY - cy) / rect.height;

      members.forEach((m, i) => {
        const pull = 14 + i * 2.5;
        m.style.setProperty("--pull-x", `${dx * pull}px`);
        m.style.setProperty("--pull-y", `${dy * pull}px`);
      });
    };

    const onLeave = () => {
      members.forEach(m => {
        m.style.setProperty("--pull-x", "0px");
        m.style.setProperty("--pull-y", "0px");
      });
    };

    sec.addEventListener("mousemove", onMove);
    sec.addEventListener("mouseleave", onLeave);
    return () => {
      sec.removeEventListener("mousemove", onMove);
      sec.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <section className="sec" id="chama" ref={sectionRef}>
      <div className="wrap">
        <div className="chama-layout">

          {/* LEFT — the circle */}
          <div className="chama-arena reveal" style={{ width: 480, height: 480, position: "relative", flexShrink: 0, margin: "0 auto" }}>
            {/* Lotus — 6 petals radiating from the shared pool, one per member */}
            <svg className="chama-lotus-svg" viewBox="0 0 480 480" aria-hidden="true">
              {MEMBERS.map((m, i) => (
                <path key={i}
                  d="M 240,240 Q 294,145 240,58 Q 186,145 240,240 Z"
                  fill={i % 2 === 0 ? "rgba(196,144,32,.14)" : "rgba(150,194,68,.11)"}
                  stroke={i % 2 === 0 ? "rgba(196,144,32,.55)" : "rgba(150,194,68,.45)"}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  transform={`rotate(${m.angle + 90}, 240, 240)`}
                />
              ))}
              {/* Sepal ring — where all petals converge */}
              <circle cx="240" cy="240" r="32" fill="rgba(196,144,32,.07)" stroke="rgba(196,144,32,.22)" strokeWidth="1"/>
            </svg>

            {/* Member bubbles — positioned via CSS transform from center */}
            {MEMBERS.map((m, i) => {
              const rad = (m.angle * Math.PI) / 180;
              const bx  = RADIUS * Math.cos(rad);
              const by  = RADIUS * Math.sin(rad);
              return (
                <div
                  key={i}
                  className="chama-member"
                  style={{
                    "--bx": `${bx}px`,
                    "--by": `${by}px`,
                    transform: `translate(calc(-50% + ${bx}px + var(--pull-x, 0px)), calc(-50% + ${by}px + var(--pull-y, 0px)))`,
                  } as React.CSSProperties}
                  title={`${m.name} — ${m.contrib}`}
                >
                  <div
                    className="chama-av"
                    style={{ color: m.color }}
                  >
                    {m.initial}
                  </div>
                  <div className="chama-member-name">{m.name}</div>
                  <div className="chama-contrib-tip">{m.contrib}</div>
                </div>
              );
            })}

            {/* Center pool */}
            <div className="chama-pool">
              <div className="chama-pool-label">Group pool</div>
              <div className="chama-pool-amount">KES 63.9k</div>
              <div className="chama-pool-sub">6 members · active</div>
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
            <p style={{ marginTop: 14, fontSize: 14, color: "rgba(255,255,255,.45)", fontStyle: "italic" }}>
              ↑ Move your cursor over the circle to see the group lean toward you.
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
   AGENTS — "The Radar": tactical display with pulsing agent dots
   ══════════════════════════════════════════════════════════════════════════ */

const AGENT_DOTS = [
  { left: "50%",  top: "50%", label: "Nairobi CBD",   agents: 48, isCenter: false, delay: "0s"    },
  { left: "38%",  top: "32%", label: "Westlands",     agents: 23, isCenter: false, delay: "0.4s"  },
  { left: "65%",  top: "35%", label: "Embakasi",      agents: 31, isCenter: false, delay: "0.8s"  },
  { left: "28%",  top: "58%", label: "Kibera",        agents: 19, isCenter: false, delay: "1.2s"  },
  { left: "72%",  top: "62%", label: "Kasarani",      agents: 27, isCenter: false, delay: "1.6s"  },
  { left: "18%",  top: "72%", label: "Mombasa Rd",    agents: 14, isCenter: false, delay: "2.0s"  },
  { left: "82%",  top: "24%", label: "Ruiru",         agents: 16, isCenter: false, delay: "2.4s"  },
  { left: "55%",  top: "80%", label: "Rongai",        agents: 12, isCenter: false, delay: "2.8s"  },
] as const;

function Agents() {
  const router = useRouter();

  return (
    <section className="sec" id="agents">
      <div className="wrap">
        <div className="agents-layout">

          {/* LEFT — duka neighbourhood map */}
          <div className="duka-map-wrap reveal">
            {/* Street grid SVG backdrop (no CSS border-width anywhere) */}
            <svg className="duka-map-svg" viewBox="0 0 440 440" aria-hidden="true">
              {/* Map surface */}
              <rect width="440" height="440" rx="18" fill="rgba(3,14,8,.97)"/>

              {/* City blocks — filled rects between streets */}
              {[0,1,2,3].map(row => [0,1,2,3].map(col => (
                <rect key={`${row}-${col}`}
                  x={col * 110} y={row * 110}
                  width="96" height="96"
                  fill={(row + col) % 2 === 0 ? "rgba(10,32,18,.72)" : "rgba(7,24,13,.72)"}
                />
              )))}

              {/* Street gutters (the roads — lighter fills between blocks) */}
              {[1,2,3].map(i => (
                <rect key={`v${i}`} x={i*110-7} y={0} width="14" height="440" fill="rgba(17,166,91,.07)"/>
              ))}
              {[1,2,3].map(i => (
                <rect key={`h${i}`} x={0} y={i*110-7} width="440" height="14" fill="rgba(17,166,91,.07)"/>
              ))}

              {/* Street centre-lines */}
              {[1,2,3].map(i => (
                <line key={`vc${i}`} x1={i*110} y1={0} x2={i*110} y2={440}
                  stroke="rgba(17,166,91,.12)" strokeWidth="1" strokeDasharray="6 5"/>
              ))}
              {[1,2,3].map(i => (
                <line key={`hc${i}`} x1={0} y1={i*110} x2={440} y2={i*110}
                  stroke="rgba(17,166,91,.12)" strokeWidth="1" strokeDasharray="6 5"/>
              ))}

              {/* YOU ARE HERE marker at intersection (220, 220) */}
              <circle cx="220" cy="220" r="13" fill="rgba(196,144,32,.22)"/>
              <circle cx="220" cy="220" r="8"  fill="rgba(196,144,32,.9)"/>
              <circle cx="220" cy="220" r="4"  fill="rgba(255,255,255,.4)"/>
              <circle cx="220" cy="220" r="1.5" fill="#fff"/>
            </svg>

            {/* Agent kiosk markers (HTML so tooltips work) */}
            {AGENT_DOTS.map((d, i) => (
              <div
                key={i}
                className="duka-dot"
                style={{ left: d.left, top: d.top, animationDelay: d.delay }}
              >
                {/* Building footprint (two stacked rects = shop body + canopy) */}
                <svg width="24" height="20" viewBox="0 0 24 20" aria-hidden="true" className="duka-icon">
                  <rect x="2" y="7" width="20" height="13" rx="2" fill="rgba(150,194,68,.32)"/>
                  <rect x="0" y="4" width="24" height="5" rx="1.5" fill="rgba(150,194,68,.6)"/>
                  <rect x="8" y="11" width="8" height="9" rx="1" fill="rgba(150,194,68,.2)"/>
                </svg>
                <div className="duka-tip">
                  <b>{d.label}</b><br />{d.agents} agents
                </div>
              </div>
            ))}
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
            <div style={{ marginTop: 32 }}>
              <Button variant="gold" onClick={() => router.push("/register?redirect=/agent")}>
                Find an agent near you <i className="ti ti-arrow-right" />
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
