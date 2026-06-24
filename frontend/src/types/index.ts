// Domain types. These mirror the YeboBank database schema (see docs/DATABASE.md)
// closely enough that the backend can return them directly.

export type Role = "customer" | "agent" | "trader" | "admin";

export interface User {
  id: string;
  phone: string;          // +2547XXXXXXXX
  fullName: string;
  role: Role;
  lightningAddress: string; // user@yebobank.com
  language: "en" | "sw";
  isAgent: boolean;
}

export interface Wallet {
  balanceSats: number;
}

export type LedgerDirection = "credit" | "debit";

export interface LedgerEntry {
  id: string;
  type: string;           // deposit_mpesa, withdrawal_lightning, interest_payment, ...
  direction: LedgerDirection;
  amountSats: number;
  balanceAfter: number;
  note: string;
  createdAt: string;      // ISO timestamp
  status: "confirmed" | "pending" | "failed";
}

export interface SavingsLock {
  id: string;
  principalSats: number;
  accruedSats: number;
  lockYears: number;
  status: "active" | "matured" | "withdrawn" | "early_exit";
  lockedAt: string;
  maturesAt: string;
}

export interface Chama {
  id: string;
  name: string;
  description: string;
  balanceSats: number;
  contributionSats: number;
  memberCount: number;
  maxMembers: number;
}

export interface Agent {
  id: string;
  locationName: string;
  status: "pending" | "active" | "suspended";
  floatLimitSats: number;
  commissionRate: number;     // e.g. 0.005
  totalEarnedSats: number;
}

// A single source of exchange-rate truth shared across the UI.
export interface Rate {
  btcUsd: number;
  usdKes: number;
  btcKes: number;     // derived
  satsPerKes: number; // derived
  kesPerSat: number;  // derived
  source: string;     // "CoinGecko · live" | "simulated feed"
}
