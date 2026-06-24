"use client";

import { useEffect, useRef } from "react";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";

export default function Ticker() {
  const rate = useRate();
  const usdRef = useRef<HTMLSpanElement>(null);
  const kesRef = useRef<HTMLSpanElement>(null);
  const prevUsd = useRef(rate.btcUsd);
  const prevKes = useRef(rate.btcKes);

  useEffect(() => {
    flash(usdRef.current, rate.btcUsd - prevUsd.current);
    flash(kesRef.current, rate.btcKes - prevKes.current);
    prevUsd.current = rate.btcUsd;
    prevKes.current = rate.btcKes;
  }, [rate]);

  return (
    <div className="ticker">
      <div className="wrap">
        <div className="live">
          <span className="pulse" /> Live
        </div>
        <div className="item">
          <span className="k">BTC/USD</span>
          <span className="v" ref={usdRef}>${num(rate.btcUsd)}</span>
        </div>
        <div className="item">
          <span className="k">BTC/KES</span>
          <span className="v" ref={kesRef}>KES {num(rate.btcKes)}</span>
        </div>
        <div className="item">
          <span className="k">1 KES</span>
          <span className="v">{rate.satsPerKes.toFixed(2)}</span>
          <span className="k">sats</span>
        </div>
        <span className="src">{rate.source}</span>
      </div>
    </div>
  );
}

function flash(el: HTMLElement | null, dir: number) {
  if (!el || dir === 0) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  el.classList.remove("flash-up", "flash-dn");
  void el.offsetWidth;
  el.classList.add(dir > 0 ? "flash-up" : "flash-dn");
  setTimeout(() => el.classList.remove("flash-up", "flash-dn"), 600);
}
