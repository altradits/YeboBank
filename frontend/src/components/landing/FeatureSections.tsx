"use client";

import { useEffect, useRef, useState } from "react";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";

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

function Inflation() {
  return (
    <section className="sec">
      <div className="wrap infl">
        <div className="reveal">
          <div className="kicker"><i className="ti ti-flame" /> The problem</div>
          <h2 className="h2">
            The shilling <span className="accent">shrinks.</span><br />
            Your savings <span className="grow">shouldn&apos;t.</span>
          </h2>
          <p className="lead">
            Money sitting in mobile money loses around 7% of its value every year
            to inflation. Park the same amount in YeboBank and it earns interest in
            Bitcoin — designed to hold value across decades, not melt away.
          </p>
        </div>
        <div className="bars reveal d1">
          <div className="bar-col">
            <div className="bar bar-shrink" />
            <div className="bar-label"><b>KES in M-Pesa</b>−7% a year</div>
          </div>
          <div className="bar-col">
            <div className="bar bar-grow" />
            <div className="bar-label"><b>Sats in YeboBank</b>earning + holding value</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Savings() {
  const apyRef = useRef<HTMLSpanElement>(null);
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
              <div className="q"><i className="ti ti-info-circle" /> Interest paid from real treasury yield — never from other savers&apos; deposits.</div>
            </div>
          </div>
        </div>
        <div className="reveal d1">
          <div className="kicker"><i className="ti ti-coin" /> Savings that earn</div>
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
        </div>
      </div>
    </section>
  );
}

function Mpesa() {
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
          <div className="kicker"><i className="ti ti-device-mobile" /> M-Pesa, built in</div>
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
        </div>
      </div>
    </section>
  );
}

function Chama() {
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
          <div className="kicker"><i className="ti ti-users" /> Chama group wallets</div>
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
        </div>
      </div>
    </section>
  );
}

function Agents() {
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
          <div className="kicker"><i className="ti ti-cash" /> Agent cash network</div>
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
