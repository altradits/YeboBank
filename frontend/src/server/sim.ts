// Simulated Mlinzi (investor pool) and agent-float surfaces. These mirror the
// mock shapes so the UI works unchanged, but every figure is demo data — the
// UI labels them "simulated". Pool/agent money never touches the real-money
// ledger accounts; the pool moves through `pool`, agent float through
// `agent-float:<agentId>` / `agent-reserve:<agentId>`.

import type { DbShape } from "./store";
import { nextId } from "./store";
import { postTx, balanceOf } from "./ledger";
import type {
  IncomeSource, InvestorPosition, AccessRequest, WithdrawalRequest, AppNotification,
  PoolDeployment, VirtualCard, Agent, EmergencyContact, LedgerEntry, FIProfile,
} from "@/types";

export const SIM_MGMT_FEE = 0.02;
export const SIM_AGENT_COMMISSION = 0.005;

type Archived<T> = T & { archivedAt: string | null };

function table<T>(db: DbShape, name: string): Archived<T>[] {
  if (!db.docs[name]) db.docs[name] = [];
  return db.docs[name] as unknown as Archived<T>[];
}

function live<T>(rows: Archived<T>[]): Archived<T>[] {
  return rows.filter((r) => !r.archivedAt);
}

function notify(db: DbShape, toHandle: string, kind: AppNotification["kind"], body: string): void {
  table<AppNotification>(db, "notifications").push({
    id: nextId(db, "nt"), toHandle, kind, body,
    createdAt: new Date().toISOString(), read: false, archivedAt: null,
  });
}

// --- income sources ---------------------------------------------------------

export function listIncome(db: DbShape): IncomeSource[] {
  return live(table<IncomeSource>(db, "incomeSources"));
}

export function upsertIncome(db: DbShape, source: IncomeSource): IncomeSource {
  const rows = table<IncomeSource>(db, "incomeSources");
  const id = source.id || nextId(db, "is");
  const row = rows.find((r) => !r.archivedAt && r.id === id);
  const full = { ...source, id };
  if (row) Object.assign(row, full);
  else rows.push({ ...full, archivedAt: null });
  return full;
}

export function removeIncome(db: DbShape, id: string): void {
  const rows = table<IncomeSource>(db, "incomeSources");
  const row = rows.find((r) => !r.archivedAt && r.id === id);
  if (row) row.archivedAt = new Date().toISOString();
}

// --- investor positions -----------------------------------------------------

export function listPositions(db: DbShape): InvestorPosition[] {
  return live(table<InvestorPosition>(db, "positions"));
}

export function positionForHandle(db: DbShape, handle: string): InvestorPosition | null {
  return live(table<InvestorPosition>(db, "positions")).find((p) => p.investorHandle === handle) ?? null;
}

export function positionById(db: DbShape, id: string): InvestorPosition | null {
  const rows = table<InvestorPosition>(db, "positions");
  return rows.find((r) => !r.archivedAt && (r.id === id || r.investorHandle === id)) ?? null;
}

export function addPosition(db: DbShape, pos: Omit<InvestorPosition, "id" | "monthlyStatements">): InvestorPosition {
  const created: InvestorPosition = { ...pos, id: nextId(db, "ip"), monthlyStatements: [] };
  table<InvestorPosition>(db, "positions").push({ ...created, archivedAt: null });
  return created;
}

/** Append-only monthly statement. Fee = 2% of return, only if return > 0. */
export function postStatement(db: DbShape, positionId: string, returnKes: number): InvestorPosition {
  const pos = positionById(db, positionId);
  if (!pos) throw new Error("Investor position not found");
  const last = pos.monthlyStatements[pos.monthlyStatements.length - 1];
  const opening = last ? last.closingKes : pos.principalKesAtEntry;
  const feeKes = returnKes > 0 ? Math.round(returnKes * SIM_MGMT_FEE) : 0;
  const closingKes = opening + returnKes - feeKes;
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  pos.monthlyStatements.push({ month, openingKes: opening, returnKes, feeKes, closingKes });
  notify(db, pos.investorHandle, "statement", `Your ${month} statement is ready (simulated): ${returnKes >= 0 ? "+" : ""}KES ${returnKes.toLocaleString()} return.`);
  return { ...pos };
}

// --- access requests --------------------------------------------------------

export const SIM_DECLINE_MESSAGE =
  "Access isn't available yet. This demo simulates the friends & family investor program — no real investors, no real money.";

export function listAccess(db: DbShape): AccessRequest[] {
  return live(table<AccessRequest>(db, "accessRequests")).map((r) => ({
    handle: r.handle, name: r.name, requestedAt: r.requestedAt, status: r.status,
  }));
}

export function requestAccess(db: DbShape, handle: string, name: string): void {
  const rows = table<AccessRequest>(db, "accessRequests");
  const existing = rows.find((r) => !r.archivedAt && r.handle === handle);
  if (existing) {
    existing.status = "requested";
    return;
  }
  rows.push({ handle, name, requestedAt: new Date().toISOString(), status: "requested", archivedAt: null });
  const user = db.users.find((u) => !u.archivedAt && u.handle === handle);
  if (user) user.accessStatus = "requested";
}

export function decideAccess(
  db: DbShape, handle: string, accept: boolean, relationship?: "family" | "friend" | "investor",
): AccessRequest {
  const rows = table<AccessRequest>(db, "accessRequests");
  const r = rows.find((x) => !x.archivedAt && x.handle === handle);
  if (!r) throw new Error("Access request not found");
  r.status = accept ? "accepted" : "declined";
  const user = db.users.find((u) => !u.archivedAt && u.handle === handle);
  if (user) {
    user.accessStatus = accept ? "accepted" : "declined";
    if (accept) {
      user.relationship = relationship ?? "friend";
      user.ffVerified = true;
    }
  }
  if (accept && !positionForHandle(db, handle)) {
    addPosition(db, {
      investorHandle: handle,
      investorName: r.name,
      relationship: relationship ?? "friend",
      principalSats: 0,
      principalKesAtEntry: 0,
      entryDate: new Date().toISOString(),
      realizedReturnPctAnnual: 20,
      compounding: true,
    });
  }
  notify(db, handle, accept ? "access_accepted" : "access_declined", accept ? "Karibu — your investor access is approved (simulated)" : SIM_DECLINE_MESSAGE);
  return { handle: r.handle, name: r.name, requestedAt: r.requestedAt, status: r.status };
}

// --- withdrawals ------------------------------------------------------------

export function listWithdrawals(db: DbShape): WithdrawalRequest[] {
  return live(table<WithdrawalRequest>(db, "withdrawals"));
}

export function requestWithdrawal(db: DbShape, handle: string, sats: number): WithdrawalRequest {
  const wr: WithdrawalRequest = {
    id: nextId(db, "wr"), investorHandle: handle, amountSats: sats,
    requestedAt: new Date().toISOString(), status: "requested",
  };
  table<WithdrawalRequest>(db, "withdrawals").push({ ...wr, archivedAt: null });
  return wr;
}

export function decideWithdrawal(
  db: DbShape, id: string, approve: boolean, expectedDeliveryDate?: string, note?: string,
): WithdrawalRequest {
  const wr = live(table<WithdrawalRequest>(db, "withdrawals")).find((w) => w.id === id);
  if (!wr) throw new Error("Withdrawal not found");
  wr.status = approve ? "approved" : "declined";
  if (expectedDeliveryDate) wr.expectedDeliveryDate = expectedDeliveryDate;
  if (note !== undefined) wr.mlinziNote = note;
  notify(
    db, wr.investorHandle, "withdrawal_update",
    approve
      ? `Your withdrawal request was approved (simulated).${expectedDeliveryDate ? ` Expected delivery: ${expectedDeliveryDate}.` : ""}`
      : `Your withdrawal request was declined (simulated).${note ? ` Note: ${note}` : ""}`,
  );
  return { ...wr };
}

// --- FI profiles + notifications --------------------------------------------

export function getFI(db: DbShape, handle: string, fallbackExpenses: number): FIProfile {
  if (!db.docs.fiProfiles) db.docs.fiProfiles = [];
  const rows = db.docs.fiProfiles as unknown as (FIProfile & { archivedAt: string | null })[];
  const found = rows.find((r) => !r.archivedAt && r.handle === handle);
  if (found) return { handle: found.handle, annualExpensesKes: found.annualExpensesKes, fiRule: found.fiRule, assumedReturnPctAnnual: found.assumedReturnPctAnnual };
  const fresh: FIProfile = { handle, annualExpensesKes: fallbackExpenses, fiRule: 0.04, assumedReturnPctAnnual: 20 };
  rows.push({ ...fresh, archivedAt: null });
  return fresh;
}

export function setFI(db: DbShape, profile: FIProfile): FIProfile {
  if (!db.docs.fiProfiles) db.docs.fiProfiles = [];
  const rows = db.docs.fiProfiles as unknown as (FIProfile & { archivedAt: string | null })[];
  const found = rows.find((r) => !r.archivedAt && r.handle === profile.handle);
  if (found) Object.assign(found, profile);
  else rows.push({ ...profile, archivedAt: null });
  return profile;
}

export function myNotifications(db: DbShape, handle: string): AppNotification[] {
  return live(table<AppNotification>(db, "notifications")).filter((n) => n.toHandle === handle);
}

export function markRead(db: DbShape, id: string): void {
  const n = live(table<AppNotification>(db, "notifications")).find((x) => x.id === id);
  if (n) n.read = true;
}

// --- pool deployments (simulated) -------------------------------------------

export function listDeployments(db: DbShape): PoolDeployment[] {
  return live(table<PoolDeployment>(db, "deployments")).reverse();
}

export function deploy(
  db: DbShape,
  input: { method: PoolDeployment["method"]; amountSats: number; amountKes: number; destination: string; notes?: string },
): PoolDeployment {
  const dep: PoolDeployment = {
    id: nextId(db, "pd"),
    method: input.method,
    amountSats: input.amountSats,
    amountKes: input.amountKes,
    destination: input.destination,
    notes: input.notes,
    deployedAt: new Date().toISOString(),
  };
  table<PoolDeployment>(db, "deployments").push({ ...dep, archivedAt: null });
  // Simulated pool movement stays inside the pool books.
  try {
    postTx(
      db,
      [
        { account: "pool", debitSats: input.amountSats },
        { account: "external:simulated-investment", creditSats: input.amountSats },
      ],
      { type: "pool_deploy_simulated", note: `Simulated pool deployment (${input.method}) -${input.amountSats.toLocaleString()} sats` },
    );
  } catch {
    /* pool starts at zero in a fresh demo db; the record above still stands */
  }
  return dep;
}

// --- virtual card (simulated display only) -----------------------------------

function randomDigits(n: number): string {
  let s = "";
  while (s.length < n) s += Math.floor(Math.random() * 10).toString();
  return s;
}

export function getCard(db: DbShape): VirtualCard | null {
  const rows = live(table<VirtualCard>(db, "cards"));
  const card = rows[rows.length - 1] ?? null;
  if (!card) return null;
  if (new Date(card.cvvRotatesAt) <= new Date()) {
    card.cvv = randomDigits(3);
    card.cvvRotatesAt = new Date(Date.now() + card.cvvRotationPeriodSecs * 1000).toISOString();
  }
  return { ...card };
}

export function generateCard(db: DbShape, rotationPeriodSecs: number, limitSats: number | null): VirtualCard {
  const now = new Date();
  const card: VirtualCard = {
    id: nextId(db, "card"),
    number: `5899${randomDigits(12)}`,
    cardholder: "MLINZI",
    expiryMonth: 9,
    expiryYear: now.getFullYear() + 2,
    cvv: randomDigits(3),
    cvvRotatesAt: new Date(now.getTime() + rotationPeriodSecs * 1000).toISOString(),
    cvvRotationPeriodSecs: rotationPeriodSecs,
    status: "active",
    billingLine1: "Kimathi Street",
    billingCity: "Nairobi",
    billingPostalCode: "00100",
    billingCountry: "KE",
    limitSats,
    totalDeployedSats: 0,
    createdAt: now.toISOString(),
    lastUsedAt: null,
  };
  table<VirtualCard>(db, "cards").push({ ...card, archivedAt: null });
  return card;
}

export function rotateCvv(db: DbShape): VirtualCard {
  const rows = table<VirtualCard>(db, "cards");
  const card = live(rows)[live(rows).length - 1];
  if (!card) throw new Error("No card");
  card.cvv = randomDigits(3);
  card.cvvRotatesAt = new Date(Date.now() + card.cvvRotationPeriodSecs * 1000).toISOString();
  return { ...card };
}

export function updateCard(
  db: DbShape, patch: Partial<Pick<VirtualCard, "status" | "limitSats" | "cvvRotationPeriodSecs">>,
): VirtualCard {
  const rows = table<VirtualCard>(db, "cards");
  const card = live(rows)[live(rows).length - 1];
  if (!card) throw new Error("No card");
  Object.assign(card, patch);
  return { ...card };
}

export function deleteCard(db: DbShape): void {
  const rows = table<VirtualCard>(db, "cards");
  for (const r of rows) {
    if (!r.archivedAt) r.archivedAt = new Date().toISOString();
  }
}

// --- agent (simulated float) -------------------------------------------------

interface AgentRow {
  userId: string;
  agent: Agent;
  archivedAt: string | null;
}

const RESERVE_PIN = "123456";

export function agentFor(db: DbShape, userId: string): Agent {
  if (!db.docs.agentState) db.docs.agentState = [];
  const rows = db.docs.agentState as unknown as AgentRow[];
  let row = rows.find((r) => !r.archivedAt && r.userId === userId);
  if (!row) {
    row = {
      userId,
      agent: {
        id: nextId(db, "ag"),
        locationName: "Kawangware Market",
        status: "active",
        workingFloatSats: 2_000_000,
        reserveSats: 8_000_000,
        reserveUnlockAt: null,
        commissionRate: SIM_AGENT_COMMISSION,
        totalEarnedSats: 0,
        mpesaTillNumber: "0707172370",
        panicLevel: 0,
        panicLockedAt: null,
        contactsRequired: [],
        contactsConfirmed: [],
        emergencyContacts: [],
      },
      archivedAt: null,
    };
    rows.push(row);
  }
  return { ...row.agent, emergencyContacts: [...row.agent.emergencyContacts] };
}

function agentMut(db: DbShape, userId: string): Agent {
  const rows = db.docs.agentState as unknown as AgentRow[];
  const row = rows.find((r) => !r.archivedAt && r.userId === userId);
  if (!row) throw new Error("Agent not found");
  return row.agent;
}

export function agentLedger(db: DbShape, userId: string): LedgerEntry[] {
  if (!db.docs.agentLedger) db.docs.agentLedger = [];
  const rows = db.docs.agentLedger as unknown as (LedgerEntry & { userId: string; archivedAt: string | null })[];
  return rows.filter((r) => !r.archivedAt && r.userId === userId).reverse();
}

function agentEntry(
  db: DbShape, userId: string,
  entry: Omit<LedgerEntry, "id" | "createdAt" | "status">,
): LedgerEntry {
  if (!db.docs.agentLedger) db.docs.agentLedger = [];
  const rows = db.docs.agentLedger as unknown as (LedgerEntry & { userId: string; archivedAt: string | null })[];
  const full: LedgerEntry & { userId: string; archivedAt: string | null } = {
    ...entry, id: nextId(db, "l"), userId,
    createdAt: new Date().toISOString(), status: "confirmed", archivedAt: null,
  };
  rows.push(full);
  return { id: full.id, type: full.type, direction: full.direction, amountSats: full.amountSats, balanceAfter: full.balanceAfter, note: full.note, createdAt: full.createdAt, status: full.status };
}

export function agentCash(db: DbShape, userId: string, direction: "in" | "out", phone: string, amountSats: number): { agent: Agent; entry: LedgerEntry } {
  agentFor(db, userId);
  const a = agentMut(db, userId);
  const commission = Math.round(amountSats * a.commissionRate);
  a.totalEarnedSats += commission;
  if (direction === "in") a.workingFloatSats -= amountSats;
  else a.workingFloatSats += amountSats;
  const entry = agentEntry(db, userId, {
    type: direction === "in" ? "agent_cash_in" : "agent_cash_out",
    direction: direction === "in" ? "credit" : "debit",
    amountSats: commission,
    balanceAfter: a.totalEarnedSats,
    note: `${direction === "in" ? "Cash in" : "Cash out"} for ${phone} · commission (simulated)`,
  });
  return { agent: { ...a }, entry };
}

export function agentServiceAssist(
  db: DbShape, userId: string, phone: string, label: string, amountSats: number, note?: string,
): LedgerEntry {
  agentFor(db, userId);
  const a = agentMut(db, userId);
  return agentEntry(db, userId, {
    type: "agent_service_assist",
    direction: "credit",
    amountSats,
    balanceAfter: a.totalEarnedSats,
    note: `${label} for ${phone} via agent (simulated)${note ? ` · ${note}` : ""}`,
  });
}

export function agentSwap(
  db: DbShape, userId: string, from: string, to: string, amountKes: number, mpesaNumber?: string,
): LedgerEntry {
  agentFor(db, userId);
  const a = agentMut(db, userId);
  const commissionSats = Math.round(amountKes * a.commissionRate * 13);
  a.totalEarnedSats += commissionSats;
  return agentEntry(db, userId, {
    type: "agent_fiat_swap",
    direction: "credit",
    amountSats: commissionSats,
    balanceAfter: a.totalEarnedSats,
    note: `${from} → ${to} KES ${amountKes}${mpesaNumber ? ` · ${mpesaNumber}` : ""} · commission (simulated)`,
  });
}

export function agentTopupConfirm(db: DbShape, userId: string, amountSats: number): Agent {
  agentFor(db, userId);
  const a = agentMut(db, userId);
  a.workingFloatSats += amountSats;
  return { ...a };
}

export function reserveRelease(db: DbShape, userId: string, pin: string, delayMs: number): { ok: boolean; unlocksAt: string | null } {
  agentFor(db, userId);
  const a = agentMut(db, userId);
  if (pin.trim() !== RESERVE_PIN) return { ok: false, unlocksAt: null };
  const unlocksAt = new Date(Date.now() + delayMs).toISOString();
  a.reserveUnlockAt = unlocksAt;
  return { ok: true, unlocksAt };
}

export function reserveClaim(db: DbShape, userId: string): Agent {
  const a = agentMut(db, userId);
  if (!a.reserveUnlockAt || new Date(a.reserveUnlockAt) > new Date()) {
    throw new Error("Reserve not yet unlocked");
  }
  a.workingFloatSats += a.reserveSats;
  a.reserveSats = 0;
  a.reserveUnlockAt = null;
  return { ...a };
}

export function reserveAdd(db: DbShape, userId: string, sats: number): Agent {
  const a = agentMut(db, userId);
  const amount = Math.min(sats, a.workingFloatSats);
  a.workingFloatSats -= amount;
  a.reserveSats += amount;
  return { ...a };
}

export function agentPanic(db: DbShape, userId: string, level: 1 | 2 | 3): { level: 1 | 2 | 3; contactsRequired: string[] } {
  const a = agentMut(db, userId);
  const cs = a.emergencyContacts;
  const required =
    level === 1 ? cs.filter((c) => c.tier === "personal").map((c) => c.id)
    : level === 2 ? cs.filter((c) => c.tier === "personal" || c.tier === "legal").map((c) => c.id)
    : cs.map((c) => c.id);
  a.panicLevel = level;
  a.panicLockedAt = new Date().toISOString();
  a.contactsRequired = required;
  a.contactsConfirmed = [];
  return { level, contactsRequired: required };
}

// Demo reactivation codes (documented demo values, simulated).
const REACTIVATION: Record<string, string> = {};

export function agentReactivate(db: DbShape, userId: string, contactId: string, code: string): { accepted: boolean; allConfirmed: boolean; agent: Agent } {
  const a = agentMut(db, userId);
  const expected = REACTIVATION[contactId] || `OK-${contactId.slice(-4).toUpperCase()}`;
  const accepted = code.trim().toUpperCase() === expected.toUpperCase();
  if (accepted && !a.contactsConfirmed.includes(contactId)) a.contactsConfirmed.push(contactId);
  const allConfirmed = a.contactsRequired.length > 0 && a.contactsRequired.every((id) => a.contactsConfirmed.includes(id));
  if (allConfirmed) {
    a.panicLevel = 0;
    a.panicLockedAt = null;
    a.contactsRequired = [];
    a.contactsConfirmed = [];
  }
  return { accepted, allConfirmed, agent: { ...a } };
}

export function saveContacts(db: DbShape, userId: string, contacts: EmergencyContact[]): Agent {
  const a = agentMut(db, userId);
  a.emergencyContacts = contacts;
  return { ...a };
}

export function poolBalance(db: DbShape): number {
  return balanceOf(db, "pool");
}
