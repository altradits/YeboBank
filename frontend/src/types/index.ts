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

export interface ChamaMember {
  id: string;
  name: string;
  handle: string; // e.g. @wanjiku
  role: "admin" | "member";
  balanceSats: number;
}

export interface Chama {
  id: string;
  name: string;
  description: string;
  balanceSats: number;
  contributionSats: number;
  memberCount: number;
  maxMembers: number;
  // Additive optional fields
  members?: ChamaMember[];
  isMember?: boolean;
  pendingJoin?: boolean;
  myContributionSats?: number;
  poolContributionsSats?: number;
  poolValueSats?: number;
}

export interface ChamaGrowthPoint {
  date: string; // "YYYY-MM"
  contributedSats: number;
  valueSats: number;
}

export interface MyChamaStake {
  chamaId: string;
  name: string;
  myContributionSats: number;
  mySharePct: number;
  myValueSats: number;
  myGainSats: number;
  poolContributionsSats: number;
  poolValueSats: number;
}

export interface ChamaPortfolio {
  stakes: MyChamaStake[];
  totalContributedSats: number;
  totalValueSats: number;
  totalGainSats: number;
}

export interface Agent {
  id: string;
  locationName: string;
  status: "pending" | "active" | "suspended";
  floatLimitSats: number;
  commissionRate: number;     // e.g. 0.005
  totalEarnedSats: number;
}

export type ChamaMessageKind = "text" | "system" | "deposit" | "withdrawal" | "transfer" | "vote" | "join_request";

export interface ChamaMessage {
  id: string;
  chamaId: string;
  kind: ChamaMessageKind;
  authorHandle: string;
  authorName: string;
  body: string;
  createdAt: string; // ISO timestamp
  meta?: Record<string, unknown>; // kind-specific: voteId, requestId, sats, toHandle, etc.
}

export interface ChamaVote {
  id: string;
  chamaId: string;
  question: string;
  options: string[];
  tallies: Record<string, string[]>; // option -> voter handles
  status: "open" | "passed" | "failed";
  createdAt: string;
  closedAt?: string;
}

export interface JoinRequest {
  id: string;
  chamaId: string;
  requesterHandle: string;
  requesterName: string;
  approvals: string[];
  status: "pending" | "approved" | "rejected";
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
