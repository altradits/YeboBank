"use client";

// Live exchange-rate provider. Fetches BTC/USD + BTC/KES from CoinGecko once a
// minute and smoothly random-walks between fetches so tickers always feel alive.
// In production, point fetchPrice() at your own /api/rate (backed by the
// rate_snapshots table) instead of calling CoinGecko from the browser.

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import type { Rate } from "@/types";

const SEED_BTC_USD = 98000;
const SEED_USD_KES = 129;

function buildRate(btcUsd: number, usdKes: number, source: string): Rate {
  const btcKes = btcUsd * usdKes;
  return {
    btcUsd,
    usdKes,
    btcKes,
    satsPerKes: 1e8 / btcKes,
    kesPerSat: btcKes / 1e8,
    source,
  };
}

const RateContext = createContext<Rate>(buildRate(SEED_BTC_USD, SEED_USD_KES, "seed"));

export function useRate(): Rate {
  return useContext(RateContext);
}

export function RateProvider({ children }: { children: React.ReactNode }) {
  const [rate, setRate] = useState<Rate>(() => buildRate(SEED_BTC_USD, SEED_USD_KES, "simulated feed"));
  const usdRef = useRef(SEED_BTC_USD);
  const kesRef = useRef(SEED_USD_KES);

  const push = useCallback((source: string) => {
    setRate(buildRate(usdRef.current, kesRef.current, source));
  }, []);

  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,kes"
      );
      const data = await res.json();
      if (data?.bitcoin?.usd) {
        usdRef.current = data.bitcoin.usd;
        if (data.bitcoin.kes) kesRef.current = data.bitcoin.kes / data.bitcoin.usd;
        push("CoinGecko · live");
      } else {
        push("simulated feed");
      }
    } catch {
      push("simulated feed");
    }
  }, [push]);

  useEffect(() => {
    fetchPrice();
    const live = setInterval(fetchPrice, 60_000);
    const walk = setInterval(() => {
      const drift = (Math.random() - 0.5) * usdRef.current * 0.0012; // ±0.12%
      usdRef.current = Math.max(1000, usdRef.current + drift);
      setRate((prev) => buildRate(usdRef.current, kesRef.current, prev.source));
    }, 3000);
    return () => {
      clearInterval(live);
      clearInterval(walk);
    };
  }, [fetchPrice]);

  return <RateContext.Provider value={rate}>{children}</RateContext.Provider>;
}
