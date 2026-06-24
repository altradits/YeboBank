// Mock data. Everything here is placeholder content so the frontend renders and
// navigates fully before the backend exists. Replace by implementing src/lib/api.ts.

import type { User, Wallet, LedgerEntry, SavingsLock, Chama, Agent } from "@/types";

export const mockUser: User = {
  id: "u_demo",
  phone: "+254712345678",
  fullName: "Wanjiku Kamau",
  role: "customer",
  lightningAddress: "wanjiku@yebobank.com",
  language: "en",
  isAgent: true,
};

export const mockWallet: Wallet = {
  balanceSats: 412_500,
};

export const mockLedger: LedgerEntry[] = [
  { id: "l1", type: "interest_payment", direction: "credit", amountSats: 4230, balanceAfter: 412500, note: "Monthly interest", createdAt: iso(-2 * 3600e3), status: "confirmed" },
  { id: "l2", type: "deposit_mpesa", direction: "credit", amountSats: 39550, balanceAfter: 408270, note: "M-Pesa deposit · KES 5,000", createdAt: iso(-26 * 3600e3), status: "confirmed" },
  { id: "l3", type: "withdrawal_lightning", direction: "debit", amountSats: 12000, balanceAfter: 368720, note: "Sent to Bitrefill", createdAt: iso(-3 * 86400e3), status: "confirmed" },
  { id: "l4", type: "chama_contribution", direction: "debit", amountSats: 25000, balanceAfter: 380720, note: "Mama Mboga Chama", createdAt: iso(-6 * 86400e3), status: "confirmed" },
  { id: "l5", type: "deposit_lightning", direction: "credit", amountSats: 50000, balanceAfter: 405720, note: "Received · lightning", createdAt: iso(-8 * 86400e3), status: "confirmed" },
  { id: "l6", type: "deposit_mpesa", direction: "credit", amountSats: 7900, balanceAfter: 355720, note: "M-Pesa deposit · KES 1,000", createdAt: iso(-9 * 86400e3), status: "pending" },
  { id: "l7", type: "agent_commission", direction: "credit", amountSats: 250, balanceAfter: 347820, note: "Agent commission", createdAt: iso(-12 * 86400e3), status: "confirmed" },
];

export const mockLocks: SavingsLock[] = [
  { id: "s1", principalSats: 300000, accruedSats: 12450, lockYears: 5, status: "active", lockedAt: iso(-200 * 86400e3), maturesAt: iso(1625 * 86400e3) },
  { id: "s2", principalSats: 100000, accruedSats: 1980, lockYears: 5, status: "active", lockedAt: iso(-40 * 86400e3), maturesAt: iso(1785 * 86400e3) },
];

export const mockChamas: Chama[] = [
  { id: "c1", name: "Mama Mboga Chama", description: "Market traders saving weekly", balanceSats: 4_250_000, contributionSats: 25000, memberCount: 12, maxMembers: 30 },
  { id: "c2", name: "Boda Riders SACCO", description: "Daily float for riders", balanceSats: 1_870_000, contributionSats: 10000, memberCount: 8, maxMembers: 50 },
];

export const mockAgent: Agent = {
  id: "a1",
  locationName: "Gikomba Market, Nairobi",
  status: "active",
  floatLimitSats: 10_000_000,
  commissionRate: 0.005,
  totalEarnedSats: 184_000,
};

function iso(offsetMs: number): string {
  return new Date(Date.now() + offsetMs).toISOString();
}
