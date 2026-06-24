// Formatting helpers. All money lives in satoshis (integers) per the spec —
// these convert to display strings using a live Rate.

import type { Rate } from "@/types";

export function num(n: number, dp = 0): string {
  return Number(n).toLocaleString(undefined, {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

export function fmtSats(sats: number): string {
  return `${num(Math.round(sats))} sats`;
}

export function fmtKES(sats: number, rate: Rate, dp = 2): string {
  return `KES ${num(sats * rate.kesPerSat, dp)}`;
}

export function fmtKESraw(kes: number, dp = 2): string {
  return `KES ${num(kes, dp)}`;
}

export function fmtBTC(sats: number): string {
  return `${(sats / 1e8).toFixed(8)} BTC`;
}

export function fmtUSD(sats: number, rate: Rate, dp = 2): string {
  const btc = sats / 1e8;
  return `$${num(btc * rate.btcUsd, dp)}`;
}

export function kesToSats(kes: number, rate: Rate): number {
  return Math.round(kes * rate.satsPerKes);
}

// "3 hours ago" style relative time.
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  return `${months} mo ago`;
}

export function maskPhone(phone: string): string {
  return phone.replace(/(\d{6})(\d+)(\d{2})/, "$1****$3");
}
