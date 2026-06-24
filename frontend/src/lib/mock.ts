// Mock data. Everything here is placeholder content so the frontend renders and
// navigates fully before the backend exists. Replace by implementing src/lib/api.ts.

import type { User, Wallet, LedgerEntry, SavingsLock, Chama, Agent, ChamaMember, ChamaMessage, ChamaVote, JoinRequest, ChamaGrowthPoint } from "@/types";

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
  {
    id: "c1", name: "Mama Mboga Chama", description: "Market traders saving weekly",
    balanceSats: 4_250_000, contributionSats: 25_000, memberCount: 12, maxMembers: 30,
    myContributionSats: 250_000, poolContributionsSats: 4_100_000, poolValueSats: 4_250_000,
  },
  {
    id: "c2", name: "Boda Riders SACCO", description: "Daily float for riders",
    balanceSats: 1_870_000, contributionSats: 10_000, memberCount: 8, maxMembers: 50,
    myContributionSats: 120_000, poolContributionsSats: 1_750_000, poolValueSats: 1_870_000,
  },
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

// ── Chama feature mock data ──────────────────────────────────────────────────

export const mockChamaMembers: Record<string, ChamaMember[]> = {
  c1: [
    { id: "m1",  name: "Wanjiku Kamau",   handle: "@wanjiku",  role: "admin",  balanceSats: 45_000 },
    { id: "m2",  name: "Akinyi Otieno",   handle: "@akinyi",   role: "member", balanceSats: 38_000 },
    { id: "m3",  name: "Jane Muthoni",    handle: "@jane",     role: "member", balanceSats: 52_000 },
    { id: "m4",  name: "Grace Njeri",     handle: "@grace",    role: "member", balanceSats: 29_000 },
    { id: "m5",  name: "Beatrice Waweru", handle: "@beatrice", role: "member", balanceSats: 41_000 },
    { id: "m6",  name: "Mary Achieng",    handle: "@mary",     role: "member", balanceSats: 35_000 },
    { id: "m7",  name: "Lucy Chebet",     handle: "@lucy",     role: "member", balanceSats: 48_000 },
    { id: "m8",  name: "Faith Njoki",     handle: "@faith",    role: "member", balanceSats: 27_000 },
    { id: "m9",  name: "Esther Wanja",    handle: "@esther",   role: "member", balanceSats: 55_000 },
    { id: "m10", name: "Rose Mutua",      handle: "@rose",     role: "member", balanceSats: 31_000 },
    { id: "m11", name: "Ann Karimi",      handle: "@ann",      role: "member", balanceSats: 44_000 },
    { id: "m12", name: "Carol Ndung'u",   handle: "@carol",    role: "member", balanceSats: 39_000 },
  ],
  c2: [
    { id: "n1", name: "Kamau Njoroge",  handle: "@kamau",   role: "admin",  balanceSats: 22_000 },
    { id: "n2", name: "Otieno Boda",    handle: "@otieno",  role: "member", balanceSats: 18_000 },
    { id: "n3", name: "Peter Mwangi",   handle: "@peter",   role: "member", balanceSats: 15_000 },
    { id: "n4", name: "John Kimani",    handle: "@john",    role: "member", balanceSats: 19_000 },
    { id: "n5", name: "Samuel Odhiambo",handle: "@samuel",  role: "member", balanceSats: 21_000 },
    { id: "n6", name: "David Kariuki",  handle: "@davidk",  role: "member", balanceSats: 16_000 },
    { id: "n7", name: "James Omondi",   handle: "@james",   role: "member", balanceSats: 24_000 },
    { id: "n8", name: "Brian Mwenda",   handle: "@brian",   role: "member", balanceSats: 13_000 },
  ],
  c3: [
    { id: "f1", name: "Njambi Gitau",   handle: "@njambi",  role: "admin",  balanceSats: 60_000 },
    { id: "f2", name: "Joseph Thuku",   handle: "@joseph",  role: "member", balanceSats: 44_000 },
    { id: "f3", name: "Priscilla Wahu", handle: "@priscilla",role:"member", balanceSats: 51_000 },
    { id: "f4", name: "Daniel Mugo",    handle: "@daniel",  role: "member", balanceSats: 38_000 },
    { id: "f5", name: "Tabitha Njau",   handle: "@tabitha", role: "member", balanceSats: 47_000 },
    { id: "f6", name: "Isaac Kamau",    handle: "@isaack",  role: "member", balanceSats: 55_000 },
  ],
};

// All chamas visible on the platform (includes non-member chamas)
export const mockAllChamas: Chama[] = [
  {
    id: "c1", name: "Mama Mboga Chama",
    description: "Market traders saving weekly",
    balanceSats: 4_250_000, contributionSats: 25_000, memberCount: 12, maxMembers: 30,
    isMember: true, pendingJoin: false,
    members: mockChamaMembers.c1,
    myContributionSats: 250_000, poolContributionsSats: 4_100_000, poolValueSats: 4_250_000,
  },
  {
    id: "c2", name: "Boda Riders SACCO",
    description: "Daily float for riders",
    balanceSats: 1_870_000, contributionSats: 10_000, memberCount: 8, maxMembers: 50,
    isMember: true, pendingJoin: false,
    members: mockChamaMembers.c2,
    myContributionSats: 120_000, poolContributionsSats: 1_750_000, poolValueSats: 1_870_000,
  },
  {
    id: "c3", name: "Kiambu Farmers Group",
    description: "Agri savings & input loans for small-scale farmers",
    balanceSats: 6_100_000, contributionSats: 50_000, memberCount: 6, maxMembers: 25,
    isMember: false, pendingJoin: false,
    members: mockChamaMembers.c3,
  },
];

// Messages per chama (mutable — API functions push to these arrays)
export const mockChamaMessages: Record<string, ChamaMessage[]> = {
  c1: [
    { id: "cm1", chamaId: "c1", kind: "system",  authorHandle: "@system", authorName: "System",
      body: "Mama Mboga Chama was created by Wanjiku Kamau (@wanjiku).",
      createdAt: iso(-30 * 86400e3) },
    { id: "cm2", chamaId: "c1", kind: "deposit", authorHandle: "@wanjiku", authorName: "Wanjiku Kamau",
      body: "Wanjiku Kamau deposited KES 1,000 (~7,900 sats).",
      createdAt: iso(-25 * 86400e3), meta: { sats: 7900 } },
    { id: "cm3", chamaId: "c1", kind: "text",    authorHandle: "@akinyi",  authorName: "Akinyi Otieno",
      body: "Habari yote! Reminder: meeting next Tuesday at Gikomba 8am 🌽",
      createdAt: iso(-5 * 86400e3) },
    { id: "cm4", chamaId: "c1", kind: "vote",    authorHandle: "@jane",    authorName: "Jane Muthoni",
      body: "New vote: Should we increase monthly contribution to KES 3,000?",
      createdAt: iso(-2 * 3600e3), meta: { voteId: "v1" } },
    { id: "cm5", chamaId: "c1", kind: "join_request", authorHandle: "@system", authorName: "System",
      body: "David Kamau (@david) has requested to join the chama.",
      createdAt: iso(-1 * 3600e3), meta: { requestId: "jr1" } },
  ],
  c2: [],
  c3: [],
};

// Votes per chama (mutable)
export const mockChamaVotes: Record<string, ChamaVote[]> = {
  c1: [
    {
      id: "v1", chamaId: "c1",
      question: "Should we increase monthly contribution to KES 3,000?",
      options: ["Yes", "No"],
      tallies: { Yes: ["@akinyi", "@jane", "@grace"], No: ["@beatrice"] },
      status: "open",
      createdAt: iso(-2 * 3600e3),
    },
  ],
  c2: [],
  c3: [],
};

// Join requests (mutable)
export const mockJoinRequests: JoinRequest[] = [
  {
    id: "jr1", chamaId: "c1",
    requesterHandle: "@david", requesterName: "David Kamau",
    approvals: ["@wanjiku", "@akinyi", "@jane"],
    status: "pending",
  },
];

// My cumulative contribution vs value per month (last 12 months)
// c1: 250k contributed, 259,146 value at month 12
// c2: 120k contributed, 128,229 value at month 12
export const mockGrowthData: Record<string, ChamaGrowthPoint[]> = {
  c1: [
    { date: "2025-07", contributedSats:  20_000, valueSats:  20_050 },
    { date: "2025-08", contributedSats:  42_000, valueSats:  42_280 },
    { date: "2025-09", contributedSats:  63_000, valueSats:  63_770 },
    { date: "2025-10", contributedSats:  84_000, valueSats:  85_180 },
    { date: "2025-11", contributedSats: 105_000, valueSats: 106_900 },
    { date: "2025-12", contributedSats: 126_000, valueSats: 128_400 },
    { date: "2026-01", contributedSats: 147_000, valueSats: 150_100 },
    { date: "2026-02", contributedSats: 168_000, valueSats: 172_000 },
    { date: "2026-03", contributedSats: 189_000, valueSats: 194_000 },
    { date: "2026-04", contributedSats: 210_000, valueSats: 216_500 },
    { date: "2026-05", contributedSats: 231_000, valueSats: 238_300 },
    { date: "2026-06", contributedSats: 250_000, valueSats: 259_146 },
  ],
  c2: [
    { date: "2025-07", contributedSats:  10_000, valueSats:  10_020 },
    { date: "2025-08", contributedSats:  20_000, valueSats:  20_080 },
    { date: "2025-09", contributedSats:  30_000, valueSats:  30_200 },
    { date: "2025-10", contributedSats:  40_000, valueSats:  40_380 },
    { date: "2025-11", contributedSats:  50_000, valueSats:  50_620 },
    { date: "2025-12", contributedSats:  60_000, valueSats:  61_000 },
    { date: "2026-01", contributedSats:  70_000, valueSats:  71_550 },
    { date: "2026-02", contributedSats:  80_000, valueSats:  82_280 },
    { date: "2026-03", contributedSats:  90_000, valueSats:  93_100 },
    { date: "2026-04", contributedSats: 100_000, valueSats: 104_100 },
    { date: "2026-05", contributedSats: 110_000, valueSats: 115_280 },
    { date: "2026-06", contributedSats: 120_000, valueSats: 128_229 },
  ],
};
