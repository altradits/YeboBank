// Mock data. Everything here is placeholder content so the frontend renders and
// navigates fully before the backend exists. Replace by implementing src/lib/api.ts.

import type {
  User, Wallet, LedgerEntry, SavingsLock, Chama, Agent, ChamaMember, ChamaMessage, ChamaVote, JoinRequest,
  ChamaGrowthPoint, SavingsGrowthPoint, SavingsDeposit, PendingInvite, LockMessage,
  IncomeSource, InvestorPosition, FIProfile, WithdrawalRequest, AppNotification, AccessRequest,
  PoolDeployment,
} from "@/types";

export const mockUser: User = {
  id: "u_demo",
  phone: "+254712345678",
  fullName: "Wanjiku Kamau",
  role: "customer",
  lightningAddress: "wanjiku@yebobank.com",
  language: "en",
  isAgent: true,
  // She's a friend of the Mlinzi who hasn't yet requested investor access.
  relationship: "none",
  ffVerified: false,
  accessStatus: "none",
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
  { id: "s1", principalSats: 300000, accruedSats: 12450, lockYears: 5, status: "active", lockedAt: iso(-200 * 86400e3), maturesAt: iso(1625 * 86400e3), kind: "individual" },
  { id: "s2", principalSats: 100000, accruedSats: 1980, lockYears: 5, status: "active", lockedAt: iso(-40 * 86400e3), maturesAt: iso(1785 * 86400e3), kind: "individual" },
  {
    id: "s3", principalSats: 200000, accruedSats: 3200, lockYears: 5, status: "active",
    lockedAt: iso(-90 * 86400e3), maturesAt: iso(1735 * 86400e3),
    kind: "group", title: "Kilimani Savings Group",
    participants: [
      { handle: "@wanjiku", name: "Wanjiku Kamau", contributedSats: 100000 },
      { handle: "@akinyi", name: "Akinyi Otieno", contributedSats: 100000 },
    ],
  },
  {
    id: "s4", principalSats: 500000, accruedSats: 8750, lockYears: 7, status: "active",
    lockedAt: iso(-60 * 86400e3), maturesAt: iso(2495 * 86400e3),
    kind: "chama", title: "Mama Mboga savings", chamaId: "c1",
    participants: [
      { handle: "@wanjiku", name: "Wanjiku Kamau", contributedSats: 150000 },
      { handle: "@jane", name: "Jane Muthoni", contributedSats: 200000 },
      { handle: "@akinyi", name: "Akinyi Otieno", contributedSats: 150000 },
    ],
  },
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

// Pending lock invites for the current user (mutable — acceptInvite splices from this)
export const mockPendingInvites: PendingInvite[] = [
  { id: "inv1", kind: "chama", targetId: "c3", targetName: "Kiambu Farmers Group" },
];

// Join requests (mutable)
export const mockJoinRequests: JoinRequest[] = [
  {
    id: "jr1", chamaId: "c1",
    requesterHandle: "@david", requesterName: "David Kamau",
    approvals: ["@wanjiku", "@akinyi", "@jane"],
    status: "pending",
  },
];

// Deterministic deposit history spanning ~10 years (Jun 2016 → Jun 2026).
// Uses a seeded LCG so the series is stable across hot-reloads.
export const mockSavingsDeposits: SavingsDeposit[] = (() => {
  let seed = 0x12345678 >>> 0;
  const rand = (): number => {
    seed = (Math.imul(1_664_525, seed) + 1_013_904_223) >>> 0;
    return seed / 0x1_0000_0000;
  };
  const result: SavingsDeposit[] = [];
  let ms = Date.UTC(2016, 5, 25); // Jun 25 2016
  const end = Date.UTC(2026, 5, 25); // Jun 25 2026
  while (ms <= end) {
    result.push({
      date: new Date(ms).toISOString().slice(0, 10),
      amountSats: 5_000 + Math.floor(rand() * 45_001),
    });
    ms += (2 + Math.floor(rand() * 6)) * 86_400_000;
  }
  return result;
})();

// Cumulative principal locked vs total value (principal + accrued) per month
// Aligns with mockLocks totals: 400k principal, ~14.4k accrued at Jun 2026
export const mockSavingsGrowth: SavingsGrowthPoint[] = [
  { date: "2025-07", principalSats: 100_000, valueSats: 100_100 },
  { date: "2025-08", principalSats: 150_000, valueSats: 150_300 },
  { date: "2025-09", principalSats: 200_000, valueSats: 200_700 },
  { date: "2025-10", principalSats: 250_000, valueSats: 251_400 },
  { date: "2025-11", principalSats: 300_000, valueSats: 302_300 },
  { date: "2025-12", principalSats: 300_000, valueSats: 303_400 },
  { date: "2026-01", principalSats: 300_000, valueSats: 304_600 },
  { date: "2026-02", principalSats: 350_000, valueSats: 356_000 },
  { date: "2026-03", principalSats: 350_000, valueSats: 357_800 },
  { date: "2026-04", principalSats: 350_000, valueSats: 359_700 },
  { date: "2026-05", principalSats: 400_000, valueSats: 412_000 },
  { date: "2026-06", principalSats: 400_000, valueSats: 414_430 },
];

// Lock activity messages (mutable — postLockMessage pushes to these arrays)
// s3 = Kilimani Savings Group (group, 2 participants)
// s4 = Mama Mboga savings (chama, 3 participants)
export const mockLockMessages: Record<string, LockMessage[]> = {
  s3: [
    { id: "lm1", lockId: "s3", kind: "system",  authorHandle: "@system",  authorName: "System",
      body: "Kilimani Savings Group lock was created.",
      createdAt: iso(-90 * 86400e3) },
    { id: "lm2", lockId: "s3", kind: "deposit", authorHandle: "@wanjiku", authorName: "Wanjiku Kamau",
      body: "Wanjiku Kamau deposited KES 7,900 (~100,000 sats).",
      createdAt: iso(-90 * 86400e3), meta: { sats: 100000 } },
    { id: "lm3", lockId: "s3", kind: "deposit", authorHandle: "@akinyi",  authorName: "Akinyi Otieno",
      body: "Akinyi Otieno deposited KES 7,900 (~100,000 sats).",
      createdAt: iso(-85 * 86400e3), meta: { sats: 100000 } },
  ],
  s4: [
    { id: "lm4", lockId: "s4", kind: "system",  authorHandle: "@system",  authorName: "System",
      body: "Mama Mboga savings lock was created.",
      createdAt: iso(-60 * 86400e3) },
    { id: "lm5", lockId: "s4", kind: "deposit", authorHandle: "@wanjiku", authorName: "Wanjiku Kamau",
      body: "Wanjiku Kamau deposited KES 11,850 (~150,000 sats).",
      createdAt: iso(-60 * 86400e3), meta: { sats: 150000 } },
    { id: "lm6", lockId: "s4", kind: "deposit", authorHandle: "@jane",    authorName: "Jane Muthoni",
      body: "Jane Muthoni deposited KES 15,800 (~200,000 sats).",
      createdAt: iso(-55 * 86400e3), meta: { sats: 200000 } },
    { id: "lm7", lockId: "s4", kind: "deposit", authorHandle: "@akinyi",  authorName: "Akinyi Otieno",
      body: "Akinyi Otieno deposited KES 11,850 (~150,000 sats).",
      createdAt: iso(-50 * 86400e3), meta: { sats: 150000 } },
  ],
};

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

// ── Mlinzi (Fund Steward) mock data ──────────────────────────────────────────
// Stanley Thuita invests his own and verified family/friend capital. Member
// principal is custodied 1:1 in sats; planning/returns are tracked in KES.

const SATS_PER_KES_SEED = 7.905; // matches the seed Rate in rate-context.tsx

function buildStatements(openingKes: number, monthlyPct: number, startMonth: string, months: number): import("@/types").MonthlyStatement[] {
  const out: import("@/types").MonthlyStatement[] = [];
  let opening = openingKes;
  const [y0, m0] = startMonth.split("-").map(Number);
  for (let i = 0; i < months; i++) {
    const d = new Date(y0, m0 - 1 + i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const returnKes = Math.round(opening * (monthlyPct / 100));
    const feeKes = returnKes > 0 ? Math.round(returnKes * 0.02) : 0;
    const closingKes = opening + returnKes - feeKes;
    out.push({ month, openingKes: Math.round(opening), returnKes, feeKes, closingKes });
    opening = closingKes;
  }
  return out;
}

const MONTHLY_PCT_20Y = 20 / 12; // ~1.667%/mo, compounded — a 20%/yr assumption

export const mockIncomeSources: IncomeSource[] = [
  {
    id: "is1", name: "Kilimani 2-bed rental", type: "real_estate",
    principalKes: 500_000, realizedReturnPctAnnual: 20, compounding: true,
    liquidity: "illiquid", notes: "Rental income reinvested monthly.",
  },
];

export const mockInvestorPositions: InvestorPosition[] = [
  {
    id: "ip_stanley", investorHandle: "@stanley", investorName: "Stanley Thuita",
    relationship: "self",
    principalSats: Math.round(2_000_000 * SATS_PER_KES_SEED),
    principalKesAtEntry: 2_000_000,
    entryDate: iso(-120 * 86400e3),
    realizedReturnPctAnnual: 20, compounding: true,
    monthlyStatements: buildStatements(2_000_000, MONTHLY_PCT_20Y, "2026-03", 4),
  },
  {
    id: "ip_prudence", investorHandle: "@prudence", investorName: "Prudence Waithira",
    relationship: "family",
    principalSats: Math.round(800_000 * SATS_PER_KES_SEED),
    principalKesAtEntry: 800_000,
    entryDate: iso(-90 * 86400e3),
    realizedReturnPctAnnual: 20, compounding: true,
    monthlyStatements: buildStatements(800_000, MONTHLY_PCT_20Y, "2026-04", 3),
  },
  {
    id: "ip_charity", investorHandle: "@charity", investorName: "Charity Ngina",
    relationship: "family",
    principalSats: Math.round(500_000 * SATS_PER_KES_SEED),
    principalKesAtEntry: 500_000,
    entryDate: iso(-60 * 86400e3),
    realizedReturnPctAnnual: 20, compounding: true,
    monthlyStatements: buildStatements(500_000, MONTHLY_PCT_20Y, "2026-05", 2),
  },
];

// Pending + decided access requests. @kevin is a non-verified demo user
// Mlinzi can decline; @wanjiku's entry is added/updated by requestAccess().
export const mockAccessRequests: AccessRequest[] = [
  { handle: "@kevin", name: "Kevin Omondi", requestedAt: iso(-2 * 86400e3), status: "requested" },
];

export const mockFIProfiles: Record<string, FIProfile> = {
  "@stanley": { handle: "@stanley", annualExpensesKes: 6_000_000, fiRule: 0.04, assumedReturnPctAnnual: 20 },
  "@prudence": { handle: "@prudence", annualExpensesKes: 1_800_000, fiRule: 0.04, assumedReturnPctAnnual: 20 },
  "@charity": { handle: "@charity", annualExpensesKes: 900_000, fiRule: 0.04, assumedReturnPctAnnual: 20 },
};

export const mockWithdrawalRequests: WithdrawalRequest[] = [
  {
    id: "wr1", investorHandle: "@prudence",
    amountSats: Math.round(100_000 * SATS_PER_KES_SEED),
    requestedAt: iso(-1 * 86400e3), status: "requested",
  },
];

// Notifications keyed by handle (mutable — API functions push to this array).
export const mockNotifications: AppNotification[] = [];

// Mutable — deployPoolCapital() pushes to this array.
export const mockPoolDeployments: PoolDeployment[] = [];
