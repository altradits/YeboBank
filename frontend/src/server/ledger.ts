// Double-entry ledger. Every balance is derived from legs; nothing is stored
// as a mutable number. Each transaction posts balanced legs (debits equal
// credits) under one txId. `reconcile` proves the books still balance.

import type { DbShape, StoredLeg } from "./store";

export const MAX_MONEY_SATS = 2.1e15;

export function liveLegs(db: DbShape): StoredLeg[] {
  return db.legs.filter((l) => !l.archivedAt);
}

/** Net balance of an account: credits minus debits, derived from legs. */
export function balanceOf(db: DbShape, account: string): number {
  let bal = 0;
  for (const leg of db.legs) {
    if (leg.archivedAt || leg.account !== account) continue;
    bal += leg.creditSats - leg.debitSats;
  }
  return bal;
}

export interface LegInput {
  account: string;
  debitSats?: number;
  creditSats?: number;
}

/**
 * Post a balanced transaction. Throws when debits != credits, any amount is
 * not a non-negative integer, or a leg would push an account past MAX_MONEY.
 * Idempotent per ref: reposting the same ref returns the original txId.
 */
export function postTx(
  db: DbShape,
  legs: LegInput[],
  meta: { type: string; note: string; ref?: string; idPrefix?: string },
): string {
  if (legs.length < 2) throw new Error("transaction needs at least two legs");
  const norm = legs.map((l) => ({
    account: l.account,
    debitSats: Math.floor(l.debitSats || 0),
    creditSats: Math.floor(l.creditSats || 0),
  }));
  for (const l of norm) {
    if (!l.account || typeof l.account !== "string") throw new Error("leg needs an account");
    if (!Number.isSafeInteger(l.debitSats) || l.debitSats < 0) throw new Error("bad debit amount");
    if (!Number.isSafeInteger(l.creditSats) || l.creditSats < 0) throw new Error("bad credit amount");
  }
  const debits = norm.reduce((s, l) => s + l.debitSats, 0);
  const credits = norm.reduce((s, l) => s + l.creditSats, 0);
  if (debits !== credits) throw new Error("unbalanced transaction");
  if (debits <= 0) throw new Error("empty transaction");

  if (meta.ref) {
    const prior = db.legs.find((l) => !l.archivedAt && l.ref === meta.ref);
    if (prior) return prior.txId;
  }

  // Project balances before writing so a cap breach fails atomically.
  const deltas = new Map<string, number>();
  for (const l of norm) {
    deltas.set(l.account, (deltas.get(l.account) || 0) + (l.creditSats - l.debitSats));
  }
  for (const [account, delta] of deltas) {
    const next = balanceOf(db, account) + delta;
    if (!Number.isSafeInteger(next) || Math.abs(next) > MAX_MONEY_SATS) {
      throw new Error(`account ${account} would exceed money cap`);
    }
  }

  const txId = `tx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();
  const prefix = meta.idPrefix || "leg";
  const n = db.legs.length;
  norm.forEach((l, i) => {
    db.legs.push({
      id: `${prefix}_${n + i}_${txId.slice(3, 9)}`,
      txId,
      account: l.account,
      debitSats: l.debitSats,
      creditSats: l.creditSats,
      type: meta.type,
      note: meta.note,
      ref: meta.ref ?? null,
      createdAt,
    archivedAt: null,
    });
  });
  return txId;
}

/**
 * Verify the books: every transaction balances and total debits equal total
 * credits. Returns the list of problems (empty means reconciled).
 */
export function reconcile(db: DbShape): string[] {
  const problems: string[] = [];
  const byTx = new Map<string, StoredLeg[]>();
  let totalD = 0;
  let totalC = 0;
  for (const leg of liveLegs(db)) {
    totalD += leg.debitSats;
    totalC += leg.creditSats;
    const list = byTx.get(leg.txId) || [];
    list.push(leg);
    byTx.set(leg.txId, list);
  }
  if (totalD !== totalC) problems.push(`totals differ: debits=${totalD} credits=${totalC}`);
  for (const [txId, legs] of byTx) {
    const d = legs.reduce((s, l) => s + l.debitSats, 0);
    const c = legs.reduce((s, l) => s + l.creditSats, 0);
    if (d !== c) problems.push(`tx ${txId} unbalanced: debits=${d} credits=${c}`);
  }
  return problems;
}
