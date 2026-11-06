// Chamas over the docs tables. Pool money moves real test sats through
// the ledger (user <-> chama); votes use the >75% threshold from the spec.

import type { DbShape } from "./store";
import { nextId } from "./store";
import { postTx, balanceOf } from "./ledger";
import type { Chama, ChamaMember, ChamaMessage, ChamaVote, JoinRequest, MyChamaStake } from "@/types";

export const VOTE_THRESHOLD = 0.75;

interface ChamaRow {
  id: string;
  name: string;
  description: string;
  contributionSats: number;
  maxMembers: number;
  createdAt: string;
  archivedAt: string | null;
}

interface MemberRow {
  id: string;
  chamaId: string;
  name: string;
  handle: string;
  role: "admin" | "member";
  contributedSats: number;
  archivedAt: string | null;
}

function chamaRows(db: DbShape): ChamaRow[] {
  return db.docs.chamas as unknown as ChamaRow[];
}

function memberRows(db: DbShape): MemberRow[] {
  return db.docs.chamaMembers as unknown as MemberRow[];
}

function messageRows(db: DbShape): (ChamaMessage & { archivedAt: string | null })[] {
  return db.docs.chamaMessages as unknown as (ChamaMessage & { archivedAt: string | null })[];
}

function voteRows(db: DbShape): (ChamaVote & { archivedAt: string | null })[] {
  return db.docs.chamaVotes as unknown as (ChamaVote & { archivedAt: string | null })[];
}

function joinRows(db: DbShape): (JoinRequest & { archivedAt: string | null })[] {
  return db.docs.joinRequests as unknown as (JoinRequest & { archivedAt: string | null })[];
}

function membersOf(db: DbShape, chamaId: string): MemberRow[] {
  return memberRows(db).filter((m) => !m.archivedAt && m.chamaId === chamaId);
}

function poolOf(db: DbShape, chamaId: string): { contributed: number; value: number } {
  const contributed = membersOf(db, chamaId).reduce((s, m) => s + m.contributedSats, 0);
  const value = balanceOf(db, `chama:${chamaId}`);
  return { contributed, value };
}

export function toChama(db: DbShape, row: ChamaRow, handle: string): Chama {
  const members = membersOf(db, row.id);
  const me = members.find((m) => m.handle === handle);
  const pool = poolOf(db, row.id);
  const pending = joinRows(db).some(
    (r) => !r.archivedAt && r.chamaId === row.id && r.requesterHandle === handle && r.status === "pending",
  );
  const list: ChamaMember[] = members.map((m) => ({
    id: m.id, name: m.name, handle: m.handle, role: m.role, balanceSats: m.contributedSats,
  }));
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    balanceSats: pool.value,
    contributionSats: row.contributionSats,
    memberCount: members.length,
    maxMembers: row.maxMembers,
    members: list,
    isMember: Boolean(me),
    pendingJoin: pending && !me,
    myContributionSats: me?.contributedSats ?? 0,
    poolContributionsSats: pool.contributed,
    poolValueSats: pool.value,
  };
}

function systemMsg(db: DbShape, chamaId: string, body: string, kind: ChamaMessage["kind"] = "system", meta?: Record<string, unknown>): void {
  messageRows(db).push({
    id: nextId(db, "cm"),
    chamaId,
    kind,
    authorHandle: "@system",
    authorName: "System",
    body,
    createdAt: new Date().toISOString(),
    meta,
    archivedAt: null,
  });
}

/** Seed one discoverable demo chama (idempotent, keyed by fixed id). */
export function ensureDemoChama(db: DbShape): void {
  if (chamaRows(db).some((c) => !c.archivedAt && c.id === "c_demo_mboga")) return;
  chamaRows(db).push({
    id: "c_demo_mboga",
    name: "Mama Mboga Collective",
    description: "Demo chama — request to join and save together (test sats).",
    contributionSats: 5000,
    maxMembers: 50,
    createdAt: new Date().toISOString(),
    archivedAt: null,
  });
  memberRows(db).push({
    id: "m_demo_admin",
    chamaId: "c_demo_mboga",
    name: "Wanjiku Kamau",
    handle: "@wanjiku",
    role: "admin",
    contributedSats: 0,
    archivedAt: null,
  });
  systemMsg(db, "c_demo_mboga", "Karibu! This demo chama runs on test sats.");
}

export function listChamas(db: DbShape, handle: string, memberOnly: boolean): Chama[] {
  ensureDemoChama(db);
  return chamaRows(db)
    .filter((c) => !c.archivedAt)
    .map((c) => toChama(db, c, handle))
    .filter((c) => !memberOnly || c.isMember);
}

export function getChamaRow(db: DbShape, id: string): ChamaRow | null {
  ensureDemoChama(db);
  return chamaRows(db).find((c) => !c.archivedAt && c.id === id) ?? null;
}

export function createChama(
  db: DbShape,
  who: { handle: string; name: string },
  name: string,
  contributionSats: number,
): Chama {
  const id = nextId(db, "c");
  chamaRows(db).push({
    id, name, description: "Started by you — invite friends to join.",
    contributionSats, maxMembers: 50,
    createdAt: new Date().toISOString(), archivedAt: null,
  });
  memberRows(db).push({
    id: nextId(db, "m"), chamaId: id, name: who.name, handle: who.handle,
    role: "admin", contributedSats: 0, archivedAt: null,
  });
  systemMsg(db, id, `${who.name} started this chama.`);
  const row = getChamaRow(db, id) as ChamaRow;
  return toChama(db, row, who.handle);
}

export function invite(db: DbShape, handle: string, name: string, chamaId: string, contacts: string[]): number {
  const row = getChamaRow(db, chamaId);
  if (!row) throw new Error("Chama not found");
  if (!membersOf(db, chamaId).some((m) => m.handle === handle)) {
    throw new Error("Only members can invite to a chama");
  }
  const clean = contacts.filter(Boolean).slice(0, 20);
  for (const contact of clean) {
    systemMsg(db, chamaId, `${name} invited ${contact} to join the chama.`);
  }
  return clean.length;
}

export function messages(db: DbShape, chamaId: string): ChamaMessage[] {
  return messageRows(db)
    .filter((m) => !m.archivedAt && m.chamaId === chamaId)
    .map((m) => ({
      id: m.id, chamaId: m.chamaId, kind: m.kind, authorHandle: m.authorHandle,
      authorName: m.authorName, body: m.body, createdAt: m.createdAt, meta: m.meta,
    }));
}

export function postMessage(
  db: DbShape,
  chamaId: string,
  msg: Omit<ChamaMessage, "id" | "chamaId" | "createdAt">,
): ChamaMessage {
  if (!getChamaRow(db, chamaId)) throw new Error("Chama not found");
  const row = {
    ...msg, id: nextId(db, "cm"), chamaId,
    createdAt: new Date().toISOString(), archivedAt: null as string | null,
  };
  messageRows(db).push(row);
  return { id: row.id, chamaId, kind: row.kind, authorHandle: row.authorHandle, authorName: row.authorName, body: row.body, createdAt: row.createdAt, meta: row.meta };
}

export function votes(db: DbShape, chamaId: string): ChamaVote[] {
  return voteRows(db)
    .filter((v) => !v.archivedAt && v.chamaId === chamaId)
    .map((v) => ({
      id: v.id, chamaId: v.chamaId, question: v.question, options: v.options,
      tallies: v.tallies, status: v.status, createdAt: v.createdAt, closedAt: v.closedAt,
    }));
}

export function joinRequests(db: DbShape, chamaId: string): JoinRequest[] {
  return joinRows(db)
    .filter((r) => !r.archivedAt && r.chamaId === chamaId)
    .map((r) => ({
      id: r.id, chamaId: r.chamaId, requesterHandle: r.requesterHandle,
      requesterName: r.requesterName, approvals: [...r.approvals], status: r.status,
    }));
}

export function requestJoin(db: DbShape, who: { handle: string; name: string }, chamaId: string): JoinRequest {
  if (!getChamaRow(db, chamaId)) throw new Error("Chama not found");
  if (membersOf(db, chamaId).some((m) => m.handle === who.handle)) {
    throw new Error("Already a member");
  }
  const existing = joinRows(db).find(
    (r) => !r.archivedAt && r.chamaId === chamaId && r.requesterHandle === who.handle && r.status === "pending",
  );
  if (existing) {
    return { id: existing.id, chamaId, requesterHandle: existing.requesterHandle, requesterName: existing.requesterName, approvals: [...existing.approvals], status: existing.status };
  }
  const row = {
    id: nextId(db, "jr"), chamaId,
    requesterHandle: who.handle, requesterName: who.name,
    approvals: [] as string[], status: "pending" as const, archivedAt: null as string | null,
  };
  joinRows(db).push(row);
  systemMsg(db, chamaId, `${who.name} (${who.handle}) has requested to join the chama.`, "join_request", { requestId: row.id });
  return { id: row.id, chamaId, requesterHandle: row.requesterHandle, requesterName: row.requesterName, approvals: [], status: "pending" };
}

export function voteOnJoin(
  db: DbShape, handle: string, chamaId: string, requestId: string, approve: boolean,
): JoinRequest {
  const jr = joinRows(db).find((r) => !r.archivedAt && r.id === requestId && r.chamaId === chamaId);
  if (!jr) throw new Error("Join request not found");
  if (jr.status !== "pending") {
    return { id: jr.id, chamaId, requesterHandle: jr.requesterHandle, requesterName: jr.requesterName, approvals: [...jr.approvals], status: jr.status };
  }
  if (!membersOf(db, chamaId).some((m) => m.handle === handle)) {
    throw new Error("Only members can vote on join requests");
  }
  if (approve && !jr.approvals.includes(handle)) jr.approvals.push(handle);
  const memberCount = membersOf(db, chamaId).length || 1;
  if (jr.approvals.length > memberCount * VOTE_THRESHOLD) {
    jr.status = "approved";
    memberRows(db).push({
      id: nextId(db, "m"), chamaId, name: jr.requesterName, handle: jr.requesterHandle,
      role: "member", contributedSats: 0, archivedAt: null,
    });
    systemMsg(db, chamaId, `${jr.requesterName} (${jr.requesterHandle}) has been approved and joined the chama!`);
  } else if (!approve) {
    jr.status = "rejected";
  }
  return { id: jr.id, chamaId, requesterHandle: jr.requesterHandle, requesterName: jr.requesterName, approvals: [...jr.approvals], status: jr.status };
}

export function createVote(db: DbShape, chamaId: string, question: string, options: string[]): ChamaVote {
  if (!getChamaRow(db, chamaId)) throw new Error("Chama not found");
  const tallies: Record<string, string[]> = {};
  for (const o of options) tallies[o] = [];
  const row = {
    id: nextId(db, "v"), chamaId, question, options, tallies,
    status: "open" as const, createdAt: new Date().toISOString(),
    closedAt: undefined as string | undefined, archivedAt: null as string | null,
  };
  voteRows(db).push(row);
  return { id: row.id, chamaId, question, options, tallies, status: "open", createdAt: row.createdAt };
}

export function castVote(db: DbShape, handle: string, chamaId: string, voteId: string, option: string): ChamaVote {
  const vote = voteRows(db).find((v) => !v.archivedAt && v.id === voteId && v.chamaId === chamaId);
  if (!vote) throw new Error("Vote not found");
  if (vote.status !== "open") {
    return { id: vote.id, chamaId, question: vote.question, options: vote.options, tallies: vote.tallies, status: vote.status, createdAt: vote.createdAt, closedAt: vote.closedAt };
  }
  if (!vote.options.includes(option)) throw new Error("Unknown option");
  for (const opt of vote.options) {
    vote.tallies[opt] = (vote.tallies[opt] ?? []).filter((h) => h !== handle);
  }
  vote.tallies[option].push(handle);
  const memberCount = membersOf(db, chamaId).length || 1;
  const threshold = memberCount * VOTE_THRESHOLD;
  const allVoters = new Set(Object.values(vote.tallies).flat());
  const remaining = memberCount - allVoters.size;
  let concluded: "passed" | "failed" | null = null;
  for (const opt of vote.options) {
    if ((vote.tallies[opt]?.length ?? 0) > threshold) {
      concluded = "passed";
      vote.status = "passed";
      vote.closedAt = new Date().toISOString();
      break;
    }
  }
  if (!concluded) {
    const canAnyPass = vote.options.some((opt) => (vote.tallies[opt]?.length ?? 0) + remaining > threshold);
    if (!canAnyPass) {
      concluded = "failed";
      vote.status = "failed";
      vote.closedAt = new Date().toISOString();
    }
  }
  if (concluded) {
    const winner = vote.options.find((opt) => (vote.tallies[opt]?.length ?? 0) > threshold);
    systemMsg(
      db, chamaId,
      concluded === "passed" ? `Vote passed: "${winner}" won on "${vote.question}".` : `Vote closed with no majority on "${vote.question}".`,
    );
  }
  return { id: vote.id, chamaId, question: vote.question, options: vote.options, tallies: vote.tallies, status: vote.status, createdAt: vote.createdAt, closedAt: vote.closedAt };
}

export function deposit(db: DbShape, who: { id: string; handle: string; name: string }, chamaId: string, sats: number): void {
  const row = getChamaRow(db, chamaId);
  if (!row) throw new Error("Chama not found");
  const me = membersOf(db, chamaId).find((m) => m.handle === who.handle);
  if (!me) throw new Error("Only members can contribute");
  if (balanceOf(db, `user:${who.id}`) < sats) throw new Error("Insufficient test-sat balance");
  me.contributedSats += sats;
  postTx(
    db,
    [
      { account: `user:${who.id}`, debitSats: sats },
      { account: `chama:${chamaId}`, creditSats: sats },
    ],
    { type: "chama_deposit", note: `Chama ${row.name} contribution +${sats.toLocaleString()} sats` },
  );
  systemMsg(db, chamaId, `${who.name} contributed ${sats.toLocaleString()} sats.`, "deposit", { sats });
}

export function withdraw(db: DbShape, who: { id: string; handle: string; name: string }, chamaId: string, sats: number): void {
  const row = getChamaRow(db, chamaId);
  if (!row) throw new Error("Chama not found");
  const me = membersOf(db, chamaId).find((m) => m.handle === who.handle);
  if (!me) throw new Error("Only members can withdraw");
  if (me.contributedSats < sats) throw new Error("Exceeds your chama share");
  if (balanceOf(db, `chama:${chamaId}`) < sats) throw new Error("Chama pool is short");
  me.contributedSats -= sats;
  postTx(
    db,
    [
      { account: `chama:${chamaId}`, debitSats: sats },
      { account: `user:${who.id}`, creditSats: sats },
    ],
    { type: "chama_withdrawal", note: `Chama ${row.name} withdrawal -${sats.toLocaleString()} sats` },
  );
  systemMsg(db, chamaId, `${who.name} withdrew ${sats.toLocaleString()} sats.`, "withdrawal", { sats });
}

export function transfer(db: DbShape, handle: string, name: string, chamaId: string, toHandle: string, sats: number): void {
  if (!getChamaRow(db, chamaId)) throw new Error("Chama not found");
  const from = membersOf(db, chamaId).find((m) => m.handle === handle);
  const to = membersOf(db, chamaId).find((m) => m.handle === toHandle);
  if (!from || !to) throw new Error("Both sides must be members");
  if (from.contributedSats < sats) throw new Error("Exceeds your chama share");
  from.contributedSats -= sats;
  to.contributedSats += sats;
  systemMsg(db, chamaId, `${name} sent ${sats.toLocaleString()} sats to ${toHandle}.`, "transfer", { sats, toHandle });
}

export function stakeOf(db: DbShape, handle: string, chamaId: string): MyChamaStake {
  const row = getChamaRow(db, chamaId);
  if (!row) throw new Error("Chama not found");
  const members = membersOf(db, chamaId);
  const myC = members.find((m) => m.handle === handle)?.contributedSats ?? 0;
  const poolC = members.reduce((s, m) => s + m.contributedSats, 0);
  const poolV = balanceOf(db, `chama:${chamaId}`);
  const mySharePct = poolC > 0 ? (myC / poolC) * 100 : 0;
  const myGainSats = Math.round((mySharePct / 100) * (poolV - poolC));
  return {
    chamaId, name: row.name, myContributionSats: myC, mySharePct,
    myValueSats: myC + myGainSats, myGainSats,
    poolContributionsSats: poolC, poolValueSats: poolV,
  };
}
