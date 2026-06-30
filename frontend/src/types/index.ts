// Domain types. These mirror the YeboBank database schema (see docs/DATABASE.md)
// closely enough that the backend can return them directly.

export type Role = "customer" | "agent" | "trader" | "admin" | "mlinzi";

export interface User {
  id: string;
  phone: string;          // +2547XXXXXXXX
  fullName: string;
  role: Role;
  lightningAddress: string; // user@yebobank.com
  language: "en" | "sw";
  isAgent: boolean;
  // Additive — Mlinzi (Fund Steward) friends & family investor program.
  relationship?: "self" | "family" | "friend" | "investor" | "none";
  ffVerified?: boolean;
  accessStatus?: "none" | "requested" | "accepted" | "declined";
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
  // additive optional fields
  kind?: "individual" | "group" | "chama";
  title?: string;
  chamaId?: string;
  groupId?: string;
  participants?: { handle: string; name: string; contributedSats: number }[];
}

export interface LockContribution {
  lockId: string;
  byHandle: string;
  amountSats: number;
  at: string; // ISO timestamp
}

export interface LockIntent {
  kind: "group" | "chama";
  targetId?: string;
  amountSats?: number;
  years?: number;
  title?: string;
}

export interface PendingInvite {
  id: string;
  kind: "chama" | "group";
  targetId: string;
  targetName: string;
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

export interface SavingsGrowthPoint {
  date: string; // "YYYY-MM"
  principalSats: number;
  valueSats: number;
}

export interface SavingsDeposit {
  date: string;        // "YYYY-MM-DD"
  amountSats: number;
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

export type LockMessageKind = "deposit" | "system" | "text";

export interface LockMessage {
  id: string;
  lockId: string;
  kind: LockMessageKind;
  authorHandle: string;
  authorName: string;
  body: string;
  createdAt: string; // ISO timestamp
  meta?: Record<string, unknown>;
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

// ── Mlinzi (Fund Steward) — friends & family investor program ───────────────

export type IncomeSourceType = "real_estate" | "govt_bond" | "tbill" | "fund" | "business" | "other";

export interface IncomeSource {
  id: string;
  name: string;
  type: IncomeSourceType;
  principalKes: number;
  realizedReturnPctAnnual: number;
  compounding: boolean;
  liquidity: "liquid" | "illiquid";
  notes?: string;
}

export interface MonthlyStatement {
  month: string;     // "YYYY-MM"
  openingKes: number;
  returnKes: number;
  feeKes: number;     // 2% of returnKes if positive, else 0
  closingKes: number;
}

export interface InvestorPosition {
  id: string;
  investorHandle: string;
  investorName: string;
  relationship: "self" | "family" | "friend" | "investor";
  principalSats: number;
  principalKesAtEntry: number;
  entryDate: string; // ISO
  realizedReturnPctAnnual: number;
  compounding: boolean;
  monthlyStatements: MonthlyStatement[];
}

export interface FIProfile {
  handle: string;
  annualExpensesKes: number;
  fiRule: number;                 // e.g. 0.04
  assumedReturnPctAnnual: number; // e.g. 20
}

export type WithdrawalStatus = "requested" | "approved" | "scheduled" | "delivered" | "declined";

export interface WithdrawalRequest {
  id: string;
  investorHandle: string;
  amountSats: number;
  requestedAt: string; // ISO
  status: WithdrawalStatus;
  expectedDeliveryDate?: string; // ISO date
  mlinziNote?: string;
}

export type NotificationKind = "access_accepted" | "access_declined" | "statement" | "withdrawal_update";

export interface AppNotification {
  id: string;
  toHandle: string;
  kind: NotificationKind;
  body: string;
  createdAt: string; // ISO
  read: boolean;
}

// Pending/decided requests from prospective friends & family investors.
export interface AccessRequest {
  handle: string;
  name: string;
  requestedAt: string; // ISO
  status: "requested" | "accepted" | "declined";
}
