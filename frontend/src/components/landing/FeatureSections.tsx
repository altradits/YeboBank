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

/* ── The Problem ─────────────────────────────────────────────────────────── */

// Simplified Kenya silhouette (viewBox 0 0 200 200)
const KENYA_PATH =
  "M45,16 L52,8 L112,4 L150,9 L170,23 L174,56 L172,88 " +
  "L165,116 L153,140 L140,153 L112,162 L80,164 " +
  "L60,154 L46,140 L40,120 L36,92 L34,66 L36,46 L30,28 L40,18 Z";

function KenyaCoinMap() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [year, setYear] = useState(2020);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setActive(true); io.disconnect(); } },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    let y = 2020;
    setYear(2020);
    const tick = () => {
      if (y < 2027) {
        y++;
        setYear(y);
        timerRef.current = setTimeout(tick, 720);
      } else {
        timerRef.current = setTimeout(() => {
          y = 2020;
          setYear(2020);
          timerRef.current = setTimeout(tick, 800);
        }, 2400);
      }
    };
    timerRef.current = setTimeout(tick, 900);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active]);

  const elapsed   = year - 2020;
  const kesPwr    = Math.pow(0.93, elapsed);       // 1.00 → 0.60
  const satsMult  = Math.pow(1.30, elapsed);       // 1.00 → 3.71
  const chai      = Math.max(1, Math.floor(10 * kesPwr)); // cups at 10 bob each
  const kesScale  = kesPwr;                         // 1.0 → 0.60
  const satsScale = 1 + 0.45 * (elapsed / 7);      // 1.0 → 1.45
  const kesOp     = 0.35 + 0.65 * kesPwr;
  const satsOp    = 0.45 + 0.55 * (elapsed / 7);
  const glowPct   = elapsed / 7;
  const glowA     = (0.12 + 0.38 * glowPct).toFixed(2);
  const glowR     = Math.round(18 + 44 * glowPct);
  const glowG     = (0.08 + 0.22 * glowPct).toFixed(2);

  return (
    <div ref={wrapRef} className="kmap-wrap reveal d1">
      <svg viewBox="0 0 200 200" className="kmap-svg" aria-hidden="true">
        <path d={KENYA_PATH} className="kmap-country" />
      </svg>
      <div className="kmap-inner">
        <div className="kmap-year">{year}</div>
        <div className="kmap-coins">
          <div
            className="kmap-coin kmap-kes"
            style={{ transform: `scale(${kesScale.toFixed(3)})`, opacity: kesOp }}
          >
            <span className="kmap-sym">KES</span>
            <span className="kmap-val">{Math.round(100 * kesPwr)}</span>
            <span className="kmap-unit">bob</span>
          </div>
          <div
            className="kmap-coin kmap-sat"
            style={{
              transform: `scale(${satsScale.toFixed(3)})`,
              opacity: satsOp,
              boxShadow: `0 0 ${glowR}px rgba(224,168,0,${glowA}),0 0 ${Math.round(glowR * 0.6)}px rgba(17,166,91,${glowG})`,
            }}
          >
            <span className="kmap-sym">sats</span>
            <span className="kmap-val">{elapsed === 0 ? "1×" : `${satsMult.toFixed(1)}×`}</span>
            <span className="kmap-unit">value</span>
          </div>
        </div>
        <div className="kmap-labels">
          <div className="kmap-lbl kmap-lbl-kes">
            <b>{chai} {chai === 1 ? "cup" : "cups"} of chai</b>
            <span>100 bob bought 10 in 2020</span>
          </div>
          <div className="kmap-lbl kmap-lbl-sat">
            <b>{elapsed === 0 ? "holding steady" : `${satsMult.toFixed(1)}× more valuable`}</b>
            <span>same 100 sats from 2020</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Inflation() {
  const router = useRouter();
  return (
    <section className="sec" id="inflation">
      <div className="wrap infl">
        <div className="reveal">
          <h2 className="h2">
            The shilling <span className="accent">shrinks.</span><br />
            Your savings <span className="grow">shouldn&apos;t.</span>
          </h2>
          <p className="lead">
            100 bob in M-Pesa in 2020 barely buys half what it did. Park the same
            amount in YeboBank and it earns interest in Bitcoin — designed to hold
            value across decades, not melt away.
          </p>
          <div style={{ marginTop: 28 }}>
            <Button variant="gold" onClick={() => router.push("/register")}>
              Protect my savings <i className="ti ti-arrow-right" />
            </Button>
          </div>
        </div>
        <KenyaCoinMap />
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
