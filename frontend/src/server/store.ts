// JSON file store for the YeboBank demo backend. No external services.
// Records are never deleted: rows carry `archivedAt` and are filtered out
// instead of removed. Writes are serialised through a single in-process
// queue so concurrent requests cannot interleave a read-modify-write.

import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { dirname, resolve } from "node:path";

export interface StoredUser {
  id: string;
  phone: string;
  fullName: string;
  handle: string;
  role: "customer" | "agent" | "mlinzi";
  lightningAddress: string;
  language: "en" | "sw";
  isAgent: boolean;
  relationship: "self" | "family" | "friend" | "investor" | "none";
  ffVerified: boolean;
  accessStatus: "none" | "requested" | "accepted" | "declined";
  pinHash: string;
  pinStrikes: number;
  pinLockedUntil: string | null;
  createdAt: string;
  archivedAt: string | null;
}

export interface StoredSession {
  tokenHash: string;
  userId: string;
  csrfToken: string;
  createdAt: string;
  expiresAt: string;
  archivedAt: string | null;
}

// One leg of a double-entry transaction. A transaction is a set of legs
// sharing a `txId` whose debits equal its credits.
export interface StoredLeg {
  id: string;
  txId: string;
  account: string;
  debitSats: number;
  creditSats: number;
  type: string;
  note: string;
  ref: string | null; // idempotency key (e.g. payment hash)
  createdAt: string;
  archivedAt: string | null;
}

export interface StoredSetup {
  userId: string;
  patch: Record<string, unknown>;
  updatedAt: string;
  archivedAt: string | null;
}

export interface DbShape {
  version: 1;
  users: StoredUser[];
  sessions: StoredSession[];
  legs: StoredLeg[];
  setups: StoredSetup[];
  // PR4 tables (chamas, locks, simulated Mlinzi/agent) live here too.
  docs: Record<string, Record<string, unknown>[]>;
  counters: Record<string, number>;
}

const DEFAULT_DOC_TABLES = [
  "locks",
  "lockMessages",
  "invites",
  "chamas",
  "chamaMembers",
  "chamaMessages",
  "chamaVotes",
  "joinRequests",
  "incomeSources",
  "positions",
  "accessRequests",
  "withdrawals",
  "notifications",
  "deployments",
  "cards",
  "agentState",
  "agentLedger",
];

function emptyDb(): DbShape {
  const docs: DbShape["docs"] = {};
  for (const t of DEFAULT_DOC_TABLES) docs[t] = [];
  return { version: 1, users: [], sessions: [], legs: [], setups: [], docs, counters: {} };
}

function dbPath(): string {
  const raw = process.env.DATABASE_PATH || ".data/yebo.json";
  return resolve(process.cwd(), raw);
}

let cache: DbShape | null = null;
let cachePath = "";

function load(): DbShape {
  const path = dbPath();
  if (cache && cachePath === path) return cache;
  let db = emptyDb();
  try {
    if (existsSync(path)) {
      const parsed = JSON.parse(readFileSync(path, "utf8")) as DbShape;
      if (parsed && parsed.version === 1) {
        db = { ...emptyDb(), ...parsed, docs: { ...emptyDb().docs, ...(parsed.docs || {}) } };
      }
    }
  } catch {
    db = emptyDb();
  }
  cache = db;
  cachePath = path;
  return db;
}

function save(db: DbShape): void {
  const path = dbPath();
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, JSON.stringify(db, null, 1));
  writeFileSync(path, readFileSync(tmp));
  try {
    unlinkSync(tmp);
  } catch {
    /* best effort */
  }
  cache = db;
  cachePath = path;
}

// Serialised write queue: fn runs against the loaded db, then persists.
let queue: Promise<void> = Promise.resolve();

export function mutate<T>(fn: (db: DbShape) => T): Promise<T> {
  const run = queue.then(() => {
    const db = load();
    const out = fn(db);
    save(db);
    return out;
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function read<T>(fn: (db: DbShape) => T): T {
  return fn(load());
}

export function nextId(db: DbShape, prefix: string): string {
  const n = (db.counters[prefix] || 0) + 1;
  db.counters[prefix] = n;
  return `${prefix}_${Date.now().toString(36)}_${n.toString(36)}`;
}

/** Test hook: drop the in-memory cache so the next read hits disk. */
export function resetCacheForTests(): void {
  cache = null;
  cachePath = "";
}
