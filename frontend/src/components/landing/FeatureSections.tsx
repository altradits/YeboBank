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
      <StatementBridge />
      <SavingsMpesaPair />
      <CommunityPair />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   STATEMENT BRIDGE — full-width animated text between Inflation and Savings.
   No image; the typography IS the content. Alethia-style breathing space.
   ══════════════════════════════════════════════════════════════════════════ */

function StatementBridge() {
  return (
    <div className="statement-sec">
      <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
        <div className="sw-stack">
          <div className="sw-row">
            <span className="sw-word reveal" style={{ transitionDelay: "0s" }}>Save in</span>
            <span className="sw-word sw-electric reveal" style={{ transitionDelay: "0.1s" }}>sats.</span>
          </div>
          <div className="sw-row">
            <span className="sw-word reveal" style={{ transitionDelay: "0.22s" }}>Spend in</span>
            <span className="sw-word sw-gold reveal" style={{ transitionDelay: "0.32s" }}>shillings.</span>
          </div>
        </div>
      </div>
    </div>
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
              aria-pressed={year === y}
              aria-label={`Show year ${y}`}
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
                  <div className="io-center-body" aria-live="polite" aria-atomic="true">
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

            <div className="infl-cta">
              <Button variant="primary" onClick={() => router.push("/login?redirect=/savings")}>
                Protect my savings with sats
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   DEPOSIT PAIR — Savings + M-Pesa share the 3D phone via position:sticky.
   The phone stays anchored on the left; copy panels scroll on the right.
   Phone screen emphasis shifts with the active panel (confirmed / STK push).
   ══════════════════════════════════════════════════════════════════════════ */

function SavingsMpesaPair() {
  const router   = useRouter();
  const rate     = useRate();
  const sats     = Math.round(500 * rate.satsPerKes);
  const shellRef = useRef<HTMLDivElement>(null);
  const visRef   = useRef<HTMLDivElement>(null);
  const saveRef  = useRef<HTMLDivElement>(null);
  const mpesaRef = useRef<HTMLDivElement>(null);
  const [activePanel, setActivePanel] = useState<"save" | "mpesa">("save");

  /* JS sticky + scroll-driven phone interpolation */
  useEffect(() => {
    const shell = shellRef.current;
    const vis   = visRef.current;
    if (!shell || !vis) return;

    const mpCard  = vis.querySelector<HTMLElement>(".mp-card");
    const mpOk    = vis.querySelector<HTMLElement>(".mp-ok");
    const phone3d = vis.querySelector<HTMLElement>(".mpesa-phone-3d");
    let lastPanel: "save" | "mpesa" = "save";
    let rafId: number | null = null;
    const lp = (a: number, b: number, t: number) => a + (b - a) * t;

    const apply = () => {
      rafId = null;
      // JS sticky
      if (!window.matchMedia("(max-width:1024px)").matches) {
        const { top, height } = shell.getBoundingClientRect();
        const tx = Math.max(0, Math.min(-top, height - vis.offsetHeight));
        vis.style.transform = tx > 0 ? `translateY(${tx}px)` : "";
      } else {
        vis.style.transform = "";
      }
      // Scroll progress 0 = save centred, 1 = mpesa centred
      const save  = saveRef.current;
      const mpesa = mpesaRef.current;
      if (!save || !mpesa) return;
      const vh2         = window.innerHeight / 2;
      const sRect       = save.getBoundingClientRect();
      const mRect       = mpesa.getBoundingClientRect();
      const saveCenter  = sRect.top + sRect.height  / 2;
      const mpesaCenter = mRect.top + mRect.height / 2;
      const range = mpesaCenter - saveCenter;
      const prog  = range > 0 ? Math.max(0, Math.min(1, (vh2 - saveCenter) / range)) : 0;
      // Direct opacity interpolation
      if (mpCard) mpCard.style.opacity = (0.32 + 0.68 * prog).toFixed(3);
      if (mpOk)   mpOk.style.opacity   = (1    - 0.68 * prog).toFixed(3);
      // Glow filter interpolation — save:teal(47,224,186) → mpesa:green(112,255,69)
      if (phone3d) {
        const ri = (a: number, b: number) => Math.round(lp(a, b, prog));
        const g1 = `drop-shadow(0 0 ${ri(60,48)}px rgba(${ri(47,112)},${ri(224,255)},${ri(186,69)},${lp(.50,.30,prog).toFixed(3)}))`;
        const g2 = `drop-shadow(0 0 ${ri(120,100)}px rgba(${ri(47,112)},${ri(224,255)},${ri(186,69)},${lp(.20,.12,prog).toFixed(3)}))`;
        phone3d.style.filter = `${g1} ${g2}`;
      }
      // Keep data-active for the selected-county colour rules
      const next: "save" | "mpesa" = prog >= 0.5 ? "mpesa" : "save";
      if (next !== lastPanel) { lastPanel = next; setActivePanel(next); }
    };

    const onScroll = () => { if (rafId === null) rafId = requestAnimationFrame(apply); };
    window.addEventListener("scroll", onScroll, { passive: true });
    apply();
    return () => { window.removeEventListener("scroll", onScroll); if (rafId !== null) cancelAnimationFrame(rafId); };
  }, []);

  /* 3D tilt */
  useEffect(() => {
    const el = visRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", String((e.clientX - r.left) / r.width - 0.5));
      el.style.setProperty("--my", String((e.clientY - r.top) / r.height - 0.5));
    };
    const onLeave = () => { el.style.setProperty("--mx", "0"); el.style.setProperty("--my", "0"); };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => { el.removeEventListener("mousemove", onMove); el.removeEventListener("mouseleave", onLeave); };
  }, []);

  return (
    <div className="section-pair-shell section-pair-shell--deposit" ref={shellRef}>
      <div className="section-pair" data-active={activePanel}>

        {/* STICKY LEFT — phone persists across both copy panels */}
        <div className="section-pair-visual mpesa-visual" ref={visRef}>
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
        </div>

        {/* SCROLLING RIGHT */}
        <div className="section-pair-panels">

          {/* Panel 1: Savings */}
          <div className="section-pair-panel" id="save" ref={saveRef} data-panel="save">
            <div className="savings-copy reveal">
              <h2 className="h2">Your money earns <span className="accent">while you sleep.</span></h2>
              <div className="stat-row">
                <div className="stat-item">
                  <div className="s-num">2%</div>
                  <div className="s-lbl">yield fee — flat</div>
                </div>
                <div className="stat-item">
                  <div className="s-num">Monthly</div>
                  <div className="s-lbl">distributions</div>
                </div>
                <div className="stat-item">
                  <div className="s-num">100%</div>
                  <div className="s-lbl">principal back, early exit</div>
                </div>
              </div>
              <p className="stat-pull">If the pool earns nothing, we earn nothing.</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Button variant="primary" onClick={() => router.push("/login?redirect=/savings")}>
                  Start saving today
                </Button>
              </div>
            </div>
          </div>

          {/* Panel 2: M-Pesa */}
          <div className="section-pair-panel" id="mpesa" ref={mpesaRef} data-panel="mpesa">
            <div className="reveal d1">
              <h2 className="h2">Top up the way you <span className="grow">already pay.</span></h2>
              <div className="step-flow">
                <div className="step">
                  <div className="step-n">01</div>
                  <div>
                    <div className="step-title">Open M-Pesa, pay to YeboBank</div>
                    <div className="step-desc">Enter any shilling amount — paybill or till number.</div>
                  </div>
                </div>
                <div className="step">
                  <div className="step-n">02</div>
                  <div>
                    <div className="step-title">STK Push arrives on your phone</div>
                    <div className="step-desc">Confirm with the M-Pesa PIN you already know.</div>
                  </div>
                </div>
                <div className="step">
                  <div className="step-n">03</div>
                  <div>
                    <div className="step-title">Sats land in your wallet</div>
                    <div className="step-desc">Balance updates the moment your PIN confirms — no waiting.</div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Button variant="lime" onClick={() => router.push("/login?redirect=/deposit")}>
                  Deposit via M-Pesa
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   COMMUNITY PAIR — Chama + Agents share the Kenya map via position:sticky.
   The map stays anchored on the left while both copy panels scroll on the
   right — one visual, two sections, zero forced motion. (M3 sticky-content)
   ══════════════════════════════════════════════════════════════════════════ */

const MAP_W = 440;
const MAP_H = 557.7;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function CommunityPair() {
  const router    = useRouter();
  const shellRef  = useRef<HTMLDivElement>(null);
  const visRef    = useRef<HTMLDivElement>(null);
  const pairRef   = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [nearest, setNearest] = useState<{ label: string; n: number; km: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [activePanel, setActivePanel] = useState<"chama" | "agents">("chama");
  const chamaRef  = useRef<HTMLDivElement>(null);
  const agentsRef = useRef<HTMLDivElement>(null);

  /* JS sticky + scroll-driven map colour interpolation */
  useEffect(() => {
    const shell = shellRef.current;
    const vis   = visRef.current;
    if (!shell || !vis) return;

    const kenyaSvg = vis.querySelector<HTMLElement>(".kenya-svg");
    let lastPanel: "chama" | "agents" = "chama";
    let rafId: number | null = null;

    const lp = (a: number, b: number, t: number) => a + (b - a) * t;

    const apply = () => {
      rafId = null;
      // JS sticky
      if (!window.matchMedia("(max-width:1024px)").matches) {
        const { top, height } = shell.getBoundingClientRect();
        const tx = Math.max(0, Math.min(-top, height - vis.offsetHeight));
        vis.style.transform = tx > 0 ? `translateY(${tx}px)` : "";
      } else {
        vis.style.transform = "";
      }
      // Scroll progress 0 = chama centred, 1 = agents centred
      const chama  = chamaRef.current;
      const agents = agentsRef.current;
      const pair   = pairRef.current;
      if (!chama || !agents || !pair) return;
      const vh2          = window.innerHeight / 2;
      const cRect        = chama.getBoundingClientRect();
      const aRect        = agents.getBoundingClientRect();
      const chamaCenter  = cRect.top + cRect.height / 2;
      const agentsCenter = aRect.top + aRect.height / 2;
      const range = agentsCenter - chamaCenter;
      const p     = range > 0 ? Math.max(0, Math.min(1, (vh2 - chamaCenter) / range)) : 0;
      // Theme-aware colour interpolation — dark: gold→teal, light: amber→forest
      const light = document.documentElement.dataset.theme === "light";
      const [cFR,cFG,cFB,cFA] = light ? [168,116,0,0.07]  : [224,168,0,0.10]; // chama fill
      const [aFR,aFG,aFB,aFA] = light ? [10,152,80,0.05]  : [47,224,186,0.07]; // agents fill
      const [cSR,cSG,cSB,cSA] = light ? [168,116,0,0.38]  : [224,168,0,0.40]; // chama stroke
      const [aSR,aSG,aSB,aSA] = light ? [10,152,80,0.42]  : [112,255,69,0.48]; // agents stroke
      const [cHR,cHG,cHB,cHA] = light ? [168,116,0,0.20]  : [224,168,0,0.26]; // chama hover
      const [aHR,aHG,aHB,aHA] = light ? [10,152,80,0.18]  : [150,194,68,0.22]; // agents hover
      const [cRR,cRG,cRB,cRA] = light ? [168,116,0,0.52]  : [224,168,0,0.55]; // chama ring
      const [aRR,aRG,aRB,aRA] = light ? [10,152,80,0.60]  : [47,224,186,0.72]; // agents ring
      const [cCR,cCG,cCB,cCA] = light ? [168,116,0,0.72]  : [224,168,0,0.75]; // chama cap ring
      const [aCR,aCG,aCB,aCA] = light ? [168,116,0,0.65]  : [196,144,32,0.65]; // agents cap ring
      const rc = (a: number, b: number) => Math.round(lp(a, b, p));
      pair.style.setProperty("--county-fill",  `rgba(${rc(cFR,aFR)},${rc(cFG,aFG)},${rc(cFB,aFB)},${lp(cFA,aFA,p).toFixed(3)})`);
      pair.style.setProperty("--county-stroke", `rgba(${rc(cSR,aSR)},${rc(cSG,aSG)},${rc(cSB,aSB)},${lp(cSA,aSA,p).toFixed(3)})`);
      pair.style.setProperty("--county-hover",  `rgba(${rc(cHR,aHR)},${rc(cHG,aHG)},${rc(cHB,aHB)},${lp(cHA,aHA,p).toFixed(3)})`);
      pair.style.setProperty("--ring-bg",       `rgba(${rc(cRR,aRR)},${rc(cRG,aRG)},${rc(cRB,aRB)},${lp(cRA,aRA,p).toFixed(3)})`);
      pair.style.setProperty("--cap-ring-bg",   `rgba(${rc(cCR,aCR)},${rc(cCG,aCG)},${rc(cCB,aCB)},${lp(cCA,aCA,p).toFixed(3)})`);
      // Only flip React state at midpoint (controls SVG glow filter)
      const next: "chama" | "agents" = p >= 0.5 ? "agents" : "chama";
      if (next !== lastPanel) { lastPanel = next; setActivePanel(next); }
    };

    const onScroll = () => { if (rafId === null) rafId = requestAnimationFrame(apply); };
    window.addEventListener("scroll", onScroll, { passive: true });
    apply();
    return () => { window.removeEventListener("scroll", onScroll); if (rafId !== null) cancelAnimationFrame(rafId); };
  }, []);

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
    <div className="section-pair-shell section-pair-shell--community" ref={shellRef}>
    <div className="section-pair" data-active={activePanel} ref={pairRef}>

      {/* LEFT — Kenya map pinned via JS scroll handler */}
      <div className="section-pair-visual" ref={visRef}>
        <div className="kenya-map-wrap reveal">
          <svg className="kenya-svg" viewBox={`0 0 ${MAP_W} ${MAP_H}`} role="img"
            aria-label="Map of Kenya's 47 counties showing YeboBank coverage">
            {KENYA_COUNTIES.map((c) => (
              <path key={c.name} d={c.d}
                className={`kenya-county${selected === c.name ? " on" : ""}`}
                onClick={() => setSelected(selected === c.name ? null : c.name)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(selected === c.name ? null : c.name); } }}
                role="button"
                tabIndex={0}
                aria-pressed={selected === c.name}
                aria-label={`${c.name} — ${c.agents} agents`}
              >
                <title>{`${c.name} — ${c.agents} agents`}</title>
              </path>
            ))}
            {KENYA_CITIES.map((a, i) => (
              <g key={i} pointerEvents="none">
                <circle cx={a.x} cy={a.y} r={a.capital ? 8 : 5.5}
                  fill={a.capital ? "rgba(196,144,32,.9)" : "rgba(17,166,91,.88)"} />
                <circle cx={a.x} cy={a.y} r={a.capital ? 3.5 : 2}
                  fill="rgba(255,255,255,.55)" />
              </g>
            ))}
          </svg>

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
      </div>

      {/* SCROLLING RIGHT — two copy panels stacked vertically */}
      <div className="section-pair-panels">

        {/* Panel 1: Chama */}
        <div className="section-pair-panel" id="chama" ref={chamaRef} data-panel="chama">
          <div className="reveal d1">
            <h2 className="h2">Save together.<br /><span className="grow">See everything.</span></h2>
            <p className="lead">
              The savings tradition you already trust — now it can&apos;t be raided
              and it doesn&apos;t lose value to inflation.
            </p>
            <div className="feat-grid">
              <div className="feat-card">
                <i className="ti ti-eye" />
                <div className="fc-title">Open books</div>
                <div className="fc-desc">Every shilling in and out visible to every member.</div>
              </div>
              <div className="feat-card">
                <i className="ti ti-checkbox" />
                <div className="fc-title">Group vote</div>
                <div className="fc-desc">Payouts only move when members vote to release them.</div>
              </div>
              <div className="feat-card">
                <i className="ti ti-trending-up" />
                <div className="fc-title">Holds value</div>
                <div className="fc-desc">Sats, not KES — the pool grows instead of shrinking.</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button variant="primary" onClick={() => router.push("/login?redirect=/chama")}>
                Start or join a chama
              </Button>
            </div>
          </div>
        </div>

        {/* Panel 2: Agents */}
        <div className="section-pair-panel" id="agents" ref={agentsRef} data-panel="agents">
          <div className="reveal d1">
            <h2 className="h2">Cash in and out, <span className="accent">down the street.</span></h2>
            <p className="lead">
              No smartphone, no bundles needed. Walk to a neighbourhood agent
              and turn cash into savings — and savings back into cash.
            </p>
            <div className="agent-stat">
              <span className="as-big">47</span>
              <span className="as-unit">counties covered</span>
              <div className="agent-pills">
                <span className="agent-pill"><i className="ti ti-walk" />Always nearby</span>
                <span className="agent-pill"><i className="ti ti-wifi-off" />No internet needed</span>
                <span className="agent-pill"><i className="ti ti-heart-handshake" />Community-run</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button variant="lime" onClick={findNearMe} disabled={locating}>
                <i className="ti ti-current-location" /> {locating ? "Locating…" : "Find agents near me"}
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
    </div>
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

