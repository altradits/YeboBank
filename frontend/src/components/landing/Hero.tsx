"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import Button from "@/components/ui/Button";

const HERO_SATS = 41000;
const WORDS: { t: string; cls?: string }[] = [
  { t: "Save" }, { t: "in" }, { t: "Bitcoin.", cls: "gold" },
  { t: "Spend" }, { t: "in" }, { t: "shillings.", cls: "grn" },
];

export default function Hero() {
  const router = useRouter();
  const rate = useRate();
  const [view, setView] = useState<"sats" | "kes" | "btc">("sats");
  const [shownSats, setShownSats] = useState(0);
  const hRef = useRef<HTMLHeadingElement>(null);

  // count-up
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShownSats(HERO_SATS);
      return;
    }
    let start: number | null = null;
    let raf = 0;
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / 1500, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setShownSats(Math.round(HERO_SATS * e));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const t = setTimeout(() => (raf = requestAnimationFrame(tick)), 450);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, []);

  // headline reveal
  useEffect(() => {
    const id = setTimeout(() => hRef.current?.classList.add("go"), 150);
    return () => clearTimeout(id);
  }, []);

  function fmtView(v: number) {
    if (view === "sats") return `${num(v)} sats`;
    if (view === "kes") return `KES ${num(v * rate.kesPerSat, 2)}`;
    return `${(v / 1e8).toFixed(5)} BTC`;
  }

  return (
    <header className="hero">
      <div className="wrap">
        <div>
          <div className="eyebrow reveal">
            <b /> An open-source Bitcoin savings bank · Kenya
          </div>
          <h1 className="hero-h" ref={hRef}>
            {WORDS.map((w, i) => (
              <span
                key={i}
                className={`word${w.cls ? " " + w.cls : ""}`}
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                {w.t}{" "}
              </span>
            ))}
          </h1>
          <p className="hero-sub reveal d1">
            A real savings account that earns interest in sats — funded and
            withdrawn through the M-Pesa you already trust.{" "}
            <span className="sw">Hela yako haipungui:</span> your money stops
            shrinking.
          </p>
          <div className="hero-cta reveal d2">
            <Button variant="gold" onClick={() => router.push("/register")}>
              Open account <i className="ti ti-arrow-right" />
            </Button>
            <a href="#save" className="txtlink">
              See how it works <i className="ti ti-arrow-right" />
            </a>
          </div>
          <div className="hero-micro reveal d3">
            <span><i className="ti ti-phone" />Opens with a phone number</span>
            <span className="dot" />
            <span><i className="ti ti-brand-open-source" />Fully open source</span>
            <span className="dot" />
            <span><i className="ti ti-shield-check" />CBK sandbox pathway</span>
          </div>
        </div>

        <div className="balance reveal d2">
          <div className="head">
            <span className="lbl">Akiba yako · your balance</span>
            <span className="badge"><i className="ti ti-trending-up" /> +4,230 / mo</span>
          </div>
          <div className="amt">{fmtView(shownSats)}</div>
          <div className="conv">≈ KES {num(HERO_SATS * rate.kesPerSat, 2)}</div>
          <div className="tog" role="tablist" aria-label="Balance unit">
            {(["sats", "kes", "btc"] as const).map((v) => (
              <button
                key={v}
                className={view === v ? "on" : ""}
                onClick={() => setView(v)}
              >
                {v === "btc" ? "BTC" : v === "kes" ? "KES" : "Sats"}
              </button>
            ))}
          </div>
          <div className="qa">
            <button className="q" onClick={() => router.push("/deposit")}><i className="ti ti-arrow-down" /> Add money</button>
            <button className="q" onClick={() => router.push("/savings/lock")}><i className="ti ti-lock" /> Lock savings</button>
            <button className="q" onClick={() => router.push("/send")}><i className="ti ti-send" /> Send</button>
            <button className="q" onClick={() => router.push("/chama")}><i className="ti ti-users" /> My chama</button>
          </div>
        </div>
      </div>
    </header>
  );
}
