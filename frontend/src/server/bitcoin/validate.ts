// Pure validation helpers for the bitcoin layer. No dependencies, no I/O —
// safe to use from API routes, providers, and tests.

import { ValidationError } from "./types";

const BOLT11_RE = /^(lnbc|lntb|lnbcrt|lnsk|lnusd)[a-z0-9]+$/i;
const LIGHTNING_ADDRESS_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const ONCHAIN_RE = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/;

/** Lightning mainnet limits enforced before any provider call. */
export const MIN_LIGHTNING_SATS = 10;
export const MAX_LIGHTNING_SATS = 10_000_000; // 0.1 BTC per invoice/payment
export const MIN_ONCHAIN_SATS = 5000;

export function assertPositiveInt(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new ValidationError(`${field} must be a positive integer (sats)`);
  }
  return value;
}

export function assertLightningAmount(sats: number, field = "amountSats"): number {
  assertPositiveInt(sats, field);
  if (sats < MIN_LIGHTNING_SATS) {
    throw new ValidationError(`${field} must be at least ${MIN_LIGHTNING_SATS} sats for Lightning`);
  }
  if (sats > MAX_LIGHTNING_SATS) {
    throw new ValidationError(
      `${field} exceeds the ${MAX_LIGHTNING_SATS.toLocaleString()} sats per-payment Lightning limit — split it or use on-chain`,
    );
  }
  return sats;
}

export function isBolt11(value: string): boolean {
  if (typeof value !== "string") return false;
  const v = value.trim().toLowerCase();
  return v.length >= 20 && v.length <= 8000 && BOLT11_RE.test(v);
}

export function isLightningAddress(value: string): boolean {
  if (typeof value !== "string") return false;
  return LIGHTNING_ADDRESS_RE.test(value.trim());
}

export function isOnchainAddress(value: string): boolean {
  if (typeof value !== "string") return false;
  return ONCHAIN_RE.test(value.trim());
}

export function assertBolt11(value: unknown): string {
  if (typeof value !== "string" || !isBolt11(value)) {
    throw new ValidationError("paymentRequest must be a valid BOLT11 Lightning invoice (lnbc...)");
  }
  return value.trim();
}

/** Accepts a BOLT11 invoice or a Lightning address, returns which one it is. */
export function classifyDestination(value: unknown): { kind: "bolt11" | "lightning_address"; value: string } {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError("destination must be a BOLT11 invoice or a Lightning address (user@domain)");
  }
  const v = value.trim();
  if (isBolt11(v)) return { kind: "bolt11", value: v };
  if (isLightningAddress(v)) return { kind: "lightning_address", value: v.toLowerCase() };
  throw new ValidationError("destination must be a BOLT11 invoice (lnbc...) or a Lightning address (user@domain)");
}

export function assertMemo(value: unknown, field = "memo"): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new ValidationError(`${field} must be a string`);
  if (value.length > 639) throw new ValidationError(`${field} must be under 640 characters`);
  return value;
}

export function assertExpirySecs(value: unknown): number {
  if (value === undefined || value === null) return 3600;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 60 || value > 7 * 86400) {
    throw new ValidationError("expirySecs must be an integer between 60 and 604800 (7 days)");
  }
  return value;
}
