// =============================================================================
// API LAYER — THE ONE FILE TO CHANGE WHEN YOU BUILD THE BACKEND
// =============================================================================
// Every screen calls these functions and nothing else. Right now they resolve
// mock data after a short delay so the UI behaves like a real async app.
//
// To go live: replace each body with a fetch() to your Go server. The route
// table already exists in docs/API.md. Suggested mapping is noted per function.
// Keep the function signatures and return types identical and the UI keeps working.
// =============================================================================

import type {
  User, Wallet, LedgerEntry, SavingsLock, Chama, Agent,
} from "@/types";
import {
  mockUser, mockWallet, mockLedger, mockLocks, mockChamas, mockAgent,
} from "@/lib/mock";

const USE_MOCKS = true; // flip to false once the backend endpoints exist

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// Helper for the real implementation later. Cookies carry the session.
async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

// ---- auth --------------------------------------------------------------------
export async function login(phone: string, password: string): Promise<User> {
  if (USE_MOCKS) return delay(mockUser);
  return req<User>("/login", { method: "POST", body: JSON.stringify({ phone, password }) });
}

export async function register(phone: string, fullName: string): Promise<{ otpSent: boolean }> {
  if (USE_MOCKS) return delay({ otpSent: true });
  return req("/register", { method: "POST", body: JSON.stringify({ phone, fullName }) });
}

export async function verifyOtp(code: string): Promise<User> {
  if (USE_MOCKS) return delay(mockUser);
  return req<User>("/verify", { method: "POST", body: JSON.stringify({ code }) });
}

export async function logout(): Promise<void> {
  if (USE_MOCKS) return delay(undefined);
  await req("/logout", { method: "POST" });
}

// ---- account -----------------------------------------------------------------
export async function getUser(): Promise<User> {
  if (USE_MOCKS) return delay(mockUser);
  return req<User>("/me");
}

export async function getWallet(): Promise<Wallet> {
  if (USE_MOCKS) return delay(mockWallet);
  return req<Wallet>("/wallet");
}

export async function getHistory(): Promise<LedgerEntry[]> {
  if (USE_MOCKS) return delay(mockLedger);
  return req<LedgerEntry[]>("/history");
}

// ---- deposit / withdraw ------------------------------------------------------
export async function depositMpesa(kes: number): Promise<{ checkoutRequestId: string }> {
  if (USE_MOCKS) return delay({ checkoutRequestId: "ws_CO_demo" });
  return req("/deposit/mpesa", { method: "POST", body: JSON.stringify({ kes }) });
}

export async function withdrawMpesa(sats: number): Promise<{ ok: boolean }> {
  if (USE_MOCKS) return delay({ ok: true });
  return req("/withdraw/mpesa", { method: "POST", body: JSON.stringify({ sats }) });
}

export async function depositLightning(sats: number): Promise<{ invoice: string }> {
  if (USE_MOCKS) {
    return delay({ invoice: "lnbc" + sats + "n1pdemoinvoiceonlyplaceholdervalue" });
  }
  return req("/deposit/lightning", { method: "POST", body: JSON.stringify({ sats }) });
}

export async function sendLightning(invoiceOrAddress: string, sats: number): Promise<{ ok: boolean }> {
  if (USE_MOCKS) return delay({ ok: true });
  return req("/withdraw/lightning", { method: "POST", body: JSON.stringify({ invoiceOrAddress, sats }) });
}

// ---- savings -----------------------------------------------------------------
export async function getLocks(): Promise<SavingsLock[]> {
  if (USE_MOCKS) return delay(mockLocks);
  return req<SavingsLock[]>("/savings");
}

export async function createLock(sats: number, years: number): Promise<SavingsLock> {
  if (USE_MOCKS) {
    return delay({
      id: "s_new", principalSats: sats, accruedSats: 0, lockYears: years,
      status: "active", lockedAt: new Date().toISOString(),
      maturesAt: new Date(Date.now() + years * 365 * 86400e3).toISOString(),
    });
  }
  return req<SavingsLock>("/savings/lock", { method: "POST", body: JSON.stringify({ sats, years }) });
}

// ---- chamas ------------------------------------------------------------------
export async function getChamas(): Promise<Chama[]> {
  if (USE_MOCKS) return delay(mockChamas);
  return req<Chama[]>("/chama");
}

export async function createChama(name: string, contributionSats: number): Promise<Chama> {
  if (USE_MOCKS) {
    return delay({
      id: "c_new", name, description: "", balanceSats: 0,
      contributionSats, memberCount: 1, maxMembers: 50,
    });
  }
  return req<Chama>("/chama/create", { method: "POST", body: JSON.stringify({ name, contributionSats }) });
}

// ---- agent -------------------------------------------------------------------
export async function getAgent(): Promise<Agent> {
  if (USE_MOCKS) return delay(mockAgent);
  return req<Agent>("/agent");
}
