"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import Button from "@/components/ui/Button";
import { KENYA_COUNTIES, KENYA_CITIES } from "@/lib/kenya-counties";

import QuickProductModal, { type ProductType } from "./QuickProductModal";
import StatementBridge from "./StatementBridge";

export default function FeatureSections() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<ProductType>("savings");

  const openModal = (product: ProductType) => {
    setActiveProduct(product);
    setModalOpen(true);
  };

  return (
    <>
      <Inflation onQuickAction={() => openModal("savings")} />
      <StatementBridge />
      <SavingsMpesaPair
        onLockSavings={() => openModal("savings")}
        onMpesaDeposit={() => openModal("mpesa")}
      />
      <CommunityPair
        onChamaAction={() => openModal("chama")}
        onAgentAction={() => openModal("agent")}
      />
      <QuickProductModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialProduct={activeProduct}
      />
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
  xs: { bw: 26, bh: 30, st: 11, hw: 8 },
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
  const rx = size === "lg" ? 9 : size === "sm" ? 5 : 3;
  const lsw = size === "lg" ? 2 : 1.5;
  const fs = size === "lg" ? 11 : size === "sm" ? 7.5 : 5.5;

  const s = (xp: number, dy: number) => {
    const x = +(bw * xp).toFixed(1);
    return `M${x},${st} C${+(x - 6).toFixed(1)},${+(st - st * 0.35).toFixed(1)} ${+(x + 5).toFixed(1)},${+(st * 0.2).toFixed(1)} ${x},${dy}`;
  };

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} width={vw} height={vh}>
      {steam && (<>
        <path className="mug-st" d={s(0.28, 2)} fill="none" stroke="rgba(255,255,255,.3)" strokeWidth={lsw} strokeLinecap="round" />
        <path className="mug-st2" d={s(0.54, 1)} fill="none" stroke="rgba(255,255,255,.22)" strokeWidth={lsw * .8} strokeLinecap="round" />
        {size === "lg" && (
          <path className="mug-st3" d={s(0.76, 2)} fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1.3" strokeLinecap="round" />
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
  2015: 30_000, 2016: 82_000, 2017: 1_550_000, 2018: 355_000,
  2019: 725_000, 2020: 3_190_000, 2021: 7_800_000, 2022: 1_980_000,
  2023: 5_670_000, 2024: 12_480_000, 2025: 13_200_000, 2026: 7_994_000,
};

const SAT_KES_2015 = BTC_KES[2015] / 100_000_000;
const TOTAL_SATS = Math.ceil(100 / SAT_KES_2015);

function fmtN(n: number): string {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000 ? n.toLocaleString()
      : String(n);
}
function fmtSats(n: number): string {
  return n >= 1_000 ? `${Math.round(n / 1_000)}k` : String(Math.round(n));
}

const YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026] as const;

const ORBIT_CUPS = [
  { type: "kes" as const, delay: "0s", vy: -38 },
  { type: "sat" as const, delay: "-1.5s", vy: 32 },
  { type: "kes" as const, delay: "-3s", vy: -8 },
  { type: "sat" as const, delay: "-4.5s", vy: -28 },
  { type: "kes" as const, delay: "-6s", vy: 42 },
  { type: "sat" as const, delay: "-7.5s", vy: 16 },
] as const;

function Inflation({ onQuickAction }: { onQuickAction?: () => void }) {
  const router = useRouter();
  const secRef = useRef<HTMLElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [year, setYear] = useState(2015);
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

  const n = year - 2015;
  const chaiKES = Math.round(10 + 10 * (n / 11));
  const kesCups = Math.floor(100 / chaiKES);
  const satKes = (BTC_KES[year] ?? BTC_KES[2026]) / 100_000_000;
  const kesValue = TOTAL_SATS * satKes;
  const satCups = Math.floor(kesValue / chaiKES);
  const satsPerCup = Math.round(chaiKES / satKes);
  const kesAlpha = Math.max(0.3, kesCups / 10);
  const satAlpha = Math.min(1, 0.35 + (Math.min(satCups, 1332) / 1332) * 0.65);

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
              <h2 className="h2" style={{ color: "#071911" }}>
                Preserve.<br />
                <span style={{ color: "#8C6200" }}>Sats protect your money.</span>
              </h2>
              <p className="lead" style={{ color: "rgba(7, 25, 17, 0.78)" }}>
                Shillings lose buying power every year. KES 100 saved in Sats in 2015 buys{" "}
                <strong style={{ color: "#8C6200" }}>1,332 cups of chai</strong> today instead of just 5.
              </p>
            </div>

            <div className="infl-cta" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Button variant="gold" onClick={onQuickAction}>
                Save
              </Button>
              <Button variant="primary" onClick={() => router.push("/login?redirect=/savings")}>
                Explore
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

function SavingsMpesaPair({
  onLockSavings,
  onMpesaDeposit,
}: {
  onLockSavings?: () => void;
  onMpesaDeposit?: () => void;
}) {
  const router = useRouter();
  const rate = useRate();
  const sats = Math.round(500 * rate.satsPerKes);
  const shellRef = useRef<HTMLDivElement>(null);
  const visRef = useRef<HTMLDivElement>(null);
  const pairRef = useRef<HTMLDivElement>(null);
  const saveRef = useRef<HTMLDivElement>(null);
  const mpesaRef = useRef<HTMLDivElement>(null);
  const [activePanel, setActivePanel] = useState<"save" | "mpesa">("save");

  /* JS sticky + scroll-driven state interpolation mirroring CommunityPair */
  useEffect(() => {
    const shell = shellRef.current;
    const vis = visRef.current;
    if (!shell || !vis) return;

    let lastPanel: "save" | "mpesa" = "save";
    let rafId: number | null = null;

    const apply = () => {
      rafId = null;
      // JS sticky anchoring
      if (!window.matchMedia("(max-width:1024px)").matches) {
        const { top, height } = shell.getBoundingClientRect();
        const tx = Math.max(0, Math.min(-top, height - vis.offsetHeight));
        vis.style.transform = tx > 0 ? `translateY(${tx}px)` : "";
      } else {
        vis.style.transform = "";
      }

      // Scroll progress 0 = save centred, 1 = mpesa centred
      const save = saveRef.current;
      const mpesa = mpesaRef.current;
      const pair = pairRef.current;
      if (!save || !mpesa || !pair) return;
      const vh2 = window.innerHeight / 2;
      const sRect = save.getBoundingClientRect();
      const mRect = mpesa.getBoundingClientRect();
      const saveCenter = sRect.top + sRect.height / 2;
      const mpesaCenter = mRect.top + mRect.height / 2;
      const range = mpesaCenter - saveCenter;
      const p = range > 0 ? Math.max(0, Math.min(1, (vh2 - saveCenter) / range)) : 0;

      const next: "save" | "mpesa" = p >= 0.5 ? "mpesa" : "save";
      if (next !== lastPanel) {
        lastPanel = next;
        setActivePanel(next);
      }
    };

    const onScroll = () => {
      if (rafId === null) rafId = requestAnimationFrame(apply);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    apply();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  /* Smooth 3D tilt */
  useEffect(() => {
    const el = visRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", String((e.clientX - r.left) / r.width - 0.5));
      el.style.setProperty("--my", String((e.clientY - r.top) / r.height - 0.5));
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
    <div className="section-pair-shell section-pair-shell--deposit" ref={shellRef}>
      <div className="section-pair" data-active={activePanel} ref={pairRef}>

        {/* STICKY LEFT — Real Smartphone Frame with Dynamic Island, Hardware Buttons & Status Bar */}
        <div className="section-pair-visual mpesa-visual" ref={visRef}>
          <div className="mpesa-phone-3d">
            {/* Hardware Side Buttons */}
            <div className="phone-btn phone-btn-action" aria-hidden="true" />
            <div className="phone-btn phone-btn-vol-up" aria-hidden="true" />
            <div className="phone-btn phone-btn-vol-down" aria-hidden="true" />
            <div className="phone-btn phone-btn-power" aria-hidden="true" />

            {/* Realistic Titanium Phone Chassis */}
            <div className="phone-chassis">
              {/* Screen Glass Display */}
              <div className="phone-display">
                {/* Top Status Bar & Dynamic Island */}
                <div className="phone-status-bar" aria-hidden="true">
                  <span className="phone-time">09:41</span>
                  <div className="phone-dynamic-island">
                    <span className="phone-camera-lens" />
                    <span className="phone-speaker-slit" />
                  </div>
                  <div className="phone-status-icons">
                    <span className="phone-signal-bars" />
                    <span className="phone-wifi-icon" />
                    <span className="phone-battery-icon" />
                  </div>
                </div>

                {/* Screen App Area — Dual States for Earn & Deposit */}
                <div className="phone-app-content">
                  {/* State A: Earn / Yield Vault (Active on Earn section) */}
                  <div className={`phone-state-card phone-state-earn ${activePanel === "save" ? "active" : ""}`}>
                    <div className="mp-app-header">
                      <span className="mp-app-title">YeboBank Vault</span>
                      <span className="mp-app-badge gold">5.2% APY</span>
                    </div>
                    <div className="mp-card">
                      <div className="mp-row">
                        <span>Active Vault</span>
                        <b>Locked Sats</b>
                      </div>
                      <div className="mp-row">
                        <span>Target APY</span>
                        <b className="mp-sats-val">5.2% Real Yield</b>
                      </div>
                      <div className="mp-row">
                        <span>Monthly Distribution</span>
                        <b>Paid in Sats</b>
                      </div>
                      <div className="mp-btn gold">Grow Savings</div>
                    </div>
                    <div className="mp-ok gold">
                      <div>
                        <div className="t">Yield Active</div>
                        <div className="s">Earns automatically while you sleep</div>
                      </div>
                    </div>
                  </div>

                  {/* State B: Deposit / M-Pesa STK (Active on Deposit section) */}
                  <div className={`phone-state-card phone-state-deposit ${activePanel === "mpesa" ? "active" : ""}`}>
                    <div className="mp-app-header">
                      <span className="mp-app-title">M-PESA</span>
                      <span className="mp-app-badge">STK Push</span>
                    </div>
                    <div className="mp-card">
                      <div className="mp-row">
                        <span>Pay to</span>
                        <b>YeboBank</b>
                      </div>
                      <div className="mp-row">
                        <span>Amount</span>
                        <b>KES 500.00</b>
                      </div>
                      <div className="mp-row">
                        <span>You receive</span>
                        <b className="mp-sats-val">≈ {num(sats)} sats</b>
                      </div>
                      <div className="mp-btn">Enter PIN to confirm</div>
                    </div>
                    <div className="mp-ok">
                      <div>
                        <div className="t">Deposit confirmed</div>
                        <div className="s">Balance updated instantly</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Home Indicator Bar */}
                <div className="phone-home-indicator" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        {/* SCROLLING RIGHT */}
        <div className="section-pair-panels">

          {/* Panel 1: Savings / Yield */}
          <div className="section-pair-panel" id="save" ref={saveRef} data-panel="save">
            <div className="savings-copy reveal">
              <h2 className="h2">
                Earn.<br />
                <span className="gold-accent">Idle money loses value.</span>
              </h2>
              <p className="lead">
                Put your savings to work with 5.2% real yield paid out every month directly into your wallet.
              </p>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 24 }}>
                <Button variant="gold" onClick={onLockSavings}>
                  Lock
                </Button>
                <Button variant="primary" onClick={() => router.push("/login?redirect=/savings")}>
                  Vault
                </Button>
              </div>
            </div>
          </div>

          {/* Panel 2: M-Pesa Deposit */}
          <div className="section-pair-panel" id="mpesa" ref={mpesaRef} data-panel="mpesa">
            <div className="reveal d1">
              <h2 className="h2">
                Deposit.<br />
                <span className="green-accent">No brokers or exchanges.</span>
              </h2>
              <p className="lead">
                Top up Sats from M-Pesa with your PIN in seconds.
              </p>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 24 }}>
                <Button variant="primary" onClick={onMpesaDeposit}>
                  Deposit
                </Button>
                <Button variant="gold" onClick={() => router.push("/login?redirect=/deposit")}>
                  Guide
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

function CommunityPair({
  onChamaAction,
  onAgentAction,
}: {
  onChamaAction?: () => void;
  onAgentAction?: () => void;
}) {
  const router = useRouter();
  const shellRef = useRef<HTMLDivElement>(null);
  const visRef = useRef<HTMLDivElement>(null);
  const pairRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [nearest, setNearest] = useState<{ label: string; n: number; km: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [activePanel, setActivePanel] = useState<"chama" | "agents">("chama");
  const chamaRef = useRef<HTMLDivElement>(null);
  const agentsRef = useRef<HTMLDivElement>(null);

  /* JS sticky + scroll-driven map colour interpolation */
  useEffect(() => {
    const shell = shellRef.current;
    const vis = visRef.current;
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
      const chama = chamaRef.current;
      const agents = agentsRef.current;
      const pair = pairRef.current;
      if (!chama || !agents || !pair) return;
      const vh2 = window.innerHeight / 2;
      const cRect = chama.getBoundingClientRect();
      const aRect = agents.getBoundingClientRect();
      const chamaCenter = cRect.top + cRect.height / 2;
      const agentsCenter = aRect.top + aRect.height / 2;
      const range = agentsCenter - chamaCenter;
      const p = range > 0 ? Math.max(0, Math.min(1, (vh2 - chamaCenter) / range)) : 0;
      // Theme-aware colour interpolation — dark: gold→emerald, light: amber→forest
      const light = document.documentElement.dataset.theme === "light";
      const [cFR, cFG, cFB, cFA] = light ? [168, 116, 0, 0.07] : [212, 160, 24, 0.08]; // chama fill
      const [aFR, aFG, aFB, aFA] = light ? [10, 152, 80, 0.05] : [60, 208, 122, 0.08]; // agents fill
      const [cSR, cSG, cSB, cSA] = light ? [168, 116, 0, 0.38] : [212, 160, 24, 0.45]; // chama stroke
      const [aSR, aSG, aSB, aSA] = light ? [10, 152, 80, 0.42] : [60, 208, 122, 0.45]; // agents stroke
      const [cHR, cHG, cHB, cHA] = light ? [168, 116, 0, 0.20] : [212, 160, 24, 0.25]; // chama hover
      const [aHR, aHG, aHB, aHA] = light ? [10, 152, 80, 0.18] : [60, 208, 122, 0.25]; // agents hover
      const [cRR, cRG, cRB, cRA] = light ? [168, 116, 0, 0.52] : [212, 160, 24, 0.55]; // chama ring
      const [aRR, aRG, aRB, aRA] = light ? [10, 152, 80, 0.60] : [60, 208, 122, 0.60]; // agents ring
      const [cCR, cCG, cCB, cCA] = light ? [168, 116, 0, 0.72] : [212, 160, 24, 0.75]; // chama cap ring
      const [aCR, aCG, aCB, aCA] = light ? [168, 116, 0, 0.65] : [60, 208, 122, 0.65]; // agents cap ring
      const rc = (a: number, b: number) => Math.round(lp(a, b, p));
      pair.style.setProperty("--county-fill", `rgba(${rc(cFR, aFR)},${rc(cFG, aFG)},${rc(cFB, aFB)},${lp(cFA, aFA, p).toFixed(3)})`);
      pair.style.setProperty("--county-stroke", `rgba(${rc(cSR, aSR)},${rc(cSG, aSG)},${rc(cSB, aSB)},${lp(cSA, aSA, p).toFixed(3)})`);
      pair.style.setProperty("--county-hover", `rgba(${rc(cHR, aHR)},${rc(cHG, aHG)},${rc(cHB, aHB)},${lp(cHA, aHA, p).toFixed(3)})`);
      pair.style.setProperty("--ring-bg", `rgba(${rc(cRR, aRR)},${rc(cRG, aRG)},${rc(cRB, aRB)},${lp(cRA, aRA, p).toFixed(3)})`);
      pair.style.setProperty("--cap-ring-bg", `rgba(${rc(cCR, aCR)},${rc(cCG, aCG)},${rc(cCB, aCB)},${lp(cCA, aCA, p).toFixed(3)})`);
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
              <h2 className="h2">
                Pool.<br />
                <span className="gold-accent">Savings that cannot be raided.</span>
              </h2>
              <p className="lead">
                Every transaction is visible to all members and payouts only release when the group votes.
              </p>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 24 }}>
                <Button variant="gold" onClick={onChamaAction}>
                  Join
                </Button>
                <Button variant="ghost" onClick={() => router.push("/login?redirect=/chama")}>
                  Explore
                </Button>
              </div>
            </div>
          </div>

          {/* Panel 2: Agents */}
          <div className="section-pair-panel" id="agents" ref={agentsRef} data-panel="agents">
            <div className="reveal d1">
              <h2 className="h2">
                Cash.<br />
                <span className="green-accent">No smartphone or internet needed.</span>
              </h2>
              <p className="lead">
                Turn physical cash into savings and back with neighbourhood agents across 47 counties.
              </p>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 24 }}>
                <Button variant="lime" onClick={onAgentAction}>
                  Locate
                </Button>
                <Button variant="ghost" onClick={() => router.push("/login?redirect=/agent")}>
                  Manage
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

