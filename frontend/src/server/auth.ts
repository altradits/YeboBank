// Sessions and demo accounts. Cookie `yebo_session` carries an opaque token
// (sha256 of it is stored); state-changing requests must also send the
// per-session CSRF token in the X-CSRF-Token header.

import { randomBytes, createHash } from "node:crypto";
import { mutate, read, nextId, type StoredUser } from "./store";
import { hashPin } from "./pin";

export const SESSION_COOKIE = "yebo_session";
export const CSRF_COOKIE = "yebo_csrf";
const SESSION_TTL_MS = 24 * 60 * 60_000;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface PublicUser {
  id: string;
  phone: string;
  fullName: string;
  handle: string;
  role: "customer" | "agent" | "mlinzi";
  lightningAddress: string;
  language: "en" | "sw";
  isAgent: boolean;
  relationship: StoredUser["relationship"];
  ffVerified: boolean;
  accessStatus: StoredUser["accessStatus"];
}

export function toPublic(u: StoredUser): PublicUser {
  return {
    id: u.id,
    phone: u.phone,
    fullName: u.fullName,
    handle: u.handle,
    role: u.role,
    lightningAddress: u.lightningAddress,
    language: u.language,
    isAgent: u.isAgent,
    relationship: u.relationship,
    ffVerified: u.ffVerified,
    accessStatus: u.accessStatus,
  };
}

// Demo seed PIN (documented in docs/API.md). Real deployments must force a
// PIN change on first login; this repo is a test-networks demo.
export const DEMO_SEED_PIN = "284649";

const SEEDS: Array<Omit<StoredUser, "id" | "pinHash" | "pinStrikes" | "pinLockedUntil" | "createdAt" | "archivedAt">> = [
  {
    phone: "+254700000001", fullName: "Stanley Chege Thuita", handle: "@stanley",
    role: "mlinzi", lightningAddress: "stanley@yebobank.com", language: "en",
    isAgent: false, relationship: "self", ffVerified: true, accessStatus: "accepted",
  },
  {
    phone: "+254700000002", fullName: "Otieno Odhiambo", handle: "@otieno",
    role: "agent", lightningAddress: "otieno@yebobank.com", language: "sw",
    isAgent: true, relationship: "none", ffVerified: false, accessStatus: "none",
  },
  {
    phone: "+254700000003", fullName: "Prudence Waithira", handle: "@prudence",
    role: "customer", lightningAddress: "prudence@yebobank.com", language: "en",
    isAgent: false, relationship: "family", ffVerified: true, accessStatus: "accepted",
  },
  {
    phone: "+254712345678", fullName: "Wanjiku Kamau", handle: "@wanjiku",
    role: "customer", lightningAddress: "wanjiku@yebobank.com", language: "en",
    isAgent: false, relationship: "none", ffVerified: false, accessStatus: "none",
  },
];

/** Insert demo accounts on first boot. Idempotent. */
export async function ensureSeeded(): Promise<void> {
  await mutate((db) => {
    if (db.users.some((u) => !u.archivedAt)) return;
    const pinHash = hashPin(DEMO_SEED_PIN);
    const now = new Date().toISOString();
    for (const s of SEEDS) {
      db.users.push({
        ...s,
        id: nextId(db, "u"),
        pinHash,
        pinStrikes: 0,
        pinLockedUntil: null,
        createdAt: now,
        archivedAt: null,
      });
    }
  });
}

export async function createSession(userId: string): Promise<{ token: string; csrfToken: string }> {
  const token = randomBytes(32).toString("hex");
  const csrfToken = randomBytes(16).toString("hex");
  const now = new Date();
  await mutate((db) => {
    db.sessions.push({
      tokenHash: hashToken(token),
      userId,
      csrfToken,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
      archivedAt: null,
    });
  });
  return { token, csrfToken };
}

export function getSessionUser(token: string | undefined): StoredUser | null {
  if (!token) return null;
  const hash = hashToken(token);
  return read((db) => {
    const s = db.sessions.find(
      (x) => !x.archivedAt && x.tokenHash === hash && new Date(x.expiresAt) > new Date(),
    );
    if (!s) return null;
    return db.users.find((u) => !u.archivedAt && u.id === s.userId) ?? null;
  });
}

export function getSessionCsrf(token: string | undefined): string | null {
  if (!token) return null;
  const hash = hashToken(token);
  return read((db) => {
    const s = db.sessions.find(
      (x) => !x.archivedAt && x.tokenHash === hash && new Date(x.expiresAt) > new Date(),
    );
    return s ? s.csrfToken : null;
  });
}

export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  const hash = hashToken(token);
  await mutate((db) => {
    const s = db.sessions.find((x) => !x.archivedAt && x.tokenHash === hash);
    if (s) s.archivedAt = new Date().toISOString();
  });
}

export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
}

export function csrfCookie(csrfToken: string): string {
  return `${CSRF_COOKIE}=${csrfToken}; Path=/; SameSite=Lax; Max-Age=86400`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return undefined;
}
