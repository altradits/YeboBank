// Savings locks over the docs tables. Contributions move real test sats
// through the ledger (user -> lock); growth figures are simulated.

import type { DbShape } from "./store";
import { nextId } from "./store";
import { postTx, balanceOf } from "./ledger";
import type { SavingsLock, LockMessage, PendingInvite } from "@/types";

interface LockRow {
  id: string;
  ownerId: string;
  principalSats: number;
  accruedSats: number;
  lockYears: number;
  status: SavingsLock["status"];
  lockedAt: string;
  maturesAt: string;
  kind: "individual" | "group" | "chama";
  title: string | null;
  chamaId: string | null;
  participants: { handle: string; name: string; contributedSats: number }[];
  archivedAt: string | null;
}

function rows(db: DbShape): LockRow[] {
  return db.docs.locks as unknown as LockRow[];
}

function msgRows(db: DbShape): (LockMessage & { archivedAt: string | null })[] {
  return db.docs.lockMessages as unknown as (LockMessage & { archivedAt: string | null })[];
}

function inviteRows(db: DbShape): (PendingInvite & { handle: string; archivedAt: string | null })[] {
  return db.docs.invites as unknown as (PendingInvite & { handle: string; archivedAt: string | null })[];
}

function toLock(r: LockRow): SavingsLock {
  return {
    id: r.id,
    principalSats: r.principalSats,
    accruedSats: r.accruedSats,
    lockYears: r.lockYears,
    status: r.status,
    lockedAt: r.lockedAt,
    maturesAt: r.maturesAt,
    kind: r.kind,
    title: r.title ?? undefined,
    chamaId: r.chamaId ?? undefined,
    participants: r.participants.map((p) => ({ ...p })),
  };
}

function systemMsg(db: DbShape, lockId: string, body: string): void {
  msgRows(db).push({
    id: nextId(db, "lm"),
    lockId,
    kind: "system",
    authorHandle: "@system",
    authorName: "System",
    body,
    createdAt: new Date().toISOString(),
    archivedAt: null,
  });
}

export function listLocks(db: DbShape, userId: string, handle: string): SavingsLock[] {
  return rows(db)
    .filter((r) => !r.archivedAt && (r.ownerId === userId || r.participants.some((p) => p.handle === handle)))
    .map(toLock);
}

export function getLockRow(db: DbShape, id: string): LockRow | null {
  return rows(db).find((r) => !r.archivedAt && r.id === id) ?? null;
}

export function createLock(
  db: DbShape,
  owner: { id: string; handle: string; name: string },
  input: { sats: number; years: number; kind?: "individual" | "group" | "chama"; title?: string; chamaId?: string; handles?: string[] },
): SavingsLock {
  if (balanceOf(db, `user:${owner.id}`) < input.sats) throw new Error("Insufficient test-sat balance");
  const now = new Date();
  const id = nextId(db, "s");
  const kind = input.kind ?? "individual";
  const participants = [
    { handle: owner.handle, name: owner.name, contributedSats: input.sats },
    ...(input.handles ?? []).map((h) => ({ handle: h, name: h, contributedSats: 0 })),
  ];
  rows(db).push({
    id,
    ownerId: owner.id,
    principalSats: input.sats,
    accruedSats: 0,
    lockYears: input.years,
    status: "active",
    lockedAt: now.toISOString(),
    maturesAt: new Date(now.getTime() + input.years * 365 * 86400_000).toISOString(),
    kind,
    title: input.title ?? null,
    chamaId: input.chamaId ?? null,
    participants,
    archivedAt: null,
  });
  postTx(
    db,
    [
      { account: `user:${owner.id}`, debitSats: input.sats },
      { account: `lock:${id}`, creditSats: input.sats },
    ],
    { type: "lock_contribution", note: `Savings lock +${input.sats.toLocaleString()} sats`, ref: `lock:${id}:open` },
  );
  for (const h of input.handles ?? []) {
    inviteRows(db).push({
      id: nextId(db, "inv"),
      kind: "group",
      targetId: id,
      targetName: input.title ?? "Group lock",
      handle: h,
      archivedAt: null,
    });
  }
  systemMsg(db, id, `${owner.name} opened the lock with ${input.sats.toLocaleString()} sats.`);
  return toLock(getLockRow(db, id) as LockRow);
}

export function contribute(
  db: DbShape,
  who: { id: string; handle: string; name: string },
  lockId: string,
  sats: number,
): SavingsLock {
  const lock = getLockRow(db, lockId);
  if (!lock) throw new Error("Lock not found");
  if (lock.status !== "active") throw new Error("Lock is not active");
  if (balanceOf(db, `user:${who.id}`) < sats) throw new Error("Insufficient test-sat balance");
  lock.principalSats += sats;
  const mine = lock.participants.find((p) => p.handle === who.handle);
  if (mine) mine.contributedSats += sats;
  else lock.participants.push({ handle: who.handle, name: who.name, contributedSats: sats });
  postTx(
    db,
    [
      { account: `user:${who.id}`, debitSats: sats },
      { account: `lock:${lockId}`, creditSats: sats },
    ],
    { type: "lock_contribution", note: `Lock contribution +${sats.toLocaleString()} sats` },
  );
  msgRows(db).push({
    id: nextId(db, "lm"),
    lockId,
    kind: "deposit",
    authorHandle: who.handle,
    authorName: who.name,
    body: `${who.name} contributed ${sats.toLocaleString()} sats.`,
    createdAt: new Date().toISOString(),
    meta: { sats },
    archivedAt: null,
  });
  return toLock(lock);
}

export function myInvites(db: DbShape, handle: string): PendingInvite[] {
  return inviteRows(db)
    .filter((r) => !r.archivedAt && r.handle === handle)
    .map((r) => ({ id: r.id, kind: r.kind, targetId: r.targetId, targetName: r.targetName }));
}

export function acceptInvite(db: DbShape, handle: string, inviteId: string): void {
  const inv = inviteRows(db).find((r) => !r.archivedAt && r.id === inviteId && r.handle === handle);
  if (!inv) throw new Error("Invite not found");
  inv.archivedAt = new Date().toISOString();
  const lock = getLockRow(db, inv.targetId);
  if (lock && !lock.participants.some((p) => p.handle === handle)) {
    lock.participants.push({ handle, name: handle, contributedSats: 0 });
  }
}

export function lockMessages(db: DbShape, lockId: string): LockMessage[] {
  return msgRows(db)
    .filter((m) => !m.archivedAt && m.lockId === lockId)
    .map((m) => ({
      id: m.id, lockId: m.lockId, kind: m.kind, authorHandle: m.authorHandle,
      authorName: m.authorName, body: m.body, createdAt: m.createdAt, meta: m.meta,
    }));
}

export function postLockMessage(
  db: DbShape,
  lockId: string,
  msg: Omit<LockMessage, "id" | "lockId" | "createdAt">,
): LockMessage {
  const lock = getLockRow(db, lockId);
  if (!lock) throw new Error("Lock not found");
  const row: LockMessage & { archivedAt: string | null } = {
    ...msg,
    id: nextId(db, "lm"),
    lockId,
    createdAt: new Date().toISOString(),
    archivedAt: null,
  };
  msgRows(db).push(row);
  return { id: row.id, lockId, kind: row.kind, authorHandle: row.authorHandle, authorName: row.authorName, body: row.body, createdAt: row.createdAt, meta: row.meta };
}
