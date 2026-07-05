// Domain types. These mirror the YeboBank database schema (see docs/DATABASE.md)
// closely enough that the backend can return them directly.

export type Role = "customer" | "agent" | "mlinzi";

export interface User {
  id: string;
  phone: string;          // +2547XXXXXXXX
  fullName: string;
  role: Role;
  lightningAddress: string; // user@yebobank.com
  language: "en" | "sw";
  isAgent: boolean;
  // Additive — Mlinzi friends & family investor program.
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

// 0 = normal operation
// 1 = personal contact alerted, awaiting their code
// 2 = legal (police) alerted, awaiting officer code
// 3 = life & death — all response contacts alerted, ALL codes required
export type PanicLevel = 0 | 1 | 2 | 3;

export type ContactTier =
  | "personal"    // closest trusted person — activated by 2 taps
  | "legal"       // police / law enforcement — activated by 3 taps
  | "life_death"; // life and death response team — ALL must confirm on 4 taps

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  tier: ContactTier;
  priority: number; // lower = higher priority; 1 is contacted first
}

export interface Agent {
  id: string;
  locationName: string;
  status: "pending" | "active" | "suspended";
  workingFloatSats: number;       // immediately spendable — agent keeps this small
  reserveSats: number;            // locked; requires PIN + time delay to access
  reserveUnlockAt: string | null; // ISO — set when a release was requested
  commissionRate: number;         // e.g. 0.005
  totalEarnedSats: number;
  mpesaTillNumber: string;
  panicLevel: PanicLevel;
  panicLockedAt: string | null;
  contactsRequired: string[];     // contact IDs whose codes are still needed
  contactsConfirmed: string[];    // contact IDs who confirmed situation is safe
  emergencyContacts: EmergencyContact[];
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

// ── Virtual payment card (Mlinzi deployment card) ────────────────────────────
// One-time-CVV virtual card for deploying capital to investment platforms that
// only accept bank cards. CVV rotates on a timer so auto-renewals and
// subscriptions can never charge after the intended transaction completes.
export interface VirtualCard {
  id: string;
  number: string;                // 16 digits — stable; mask first 12 in UI
  cardholder: string;            // always "MLINZI" — never the real name
  expiryMonth: number;           // 1–12
  expiryYear: number;            // full year, e.g. 2028
  cvv: string;                   // 3-digit rotating security code
  cvvRotatesAt: string;          // ISO — when the CVV next changes
  cvvRotationPeriodSecs: number; // configurable, default 900 (15 min)
  status: "active" | "frozen";
  billingLine1: string;
  billingCity: string;
  billingPostalCode: string;
  billingCountry: string;        // ISO-3166 alpha-2, e.g. "KE"
  limitSats: number | null;      // per-transaction cap; null = no hard limit
  totalDeployedSats: number;
  createdAt: string;
  lastUsedAt: string | null;
}

// Records each time the Mlinzi moves pool capital out to fund a new investment.
export type DeployMethod = "mpesa" | "lightning" | "card";
export interface PoolDeployment {
  id: string;
  method: DeployMethod;
  amountSats: number;
  amountKes: number;
  destination: string; // M-Pesa phone number or Lightning invoice/address
  notes?: string;
  deployedAt: string; // ISO
}
