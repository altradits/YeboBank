// Server-side Altradits Developer API client. Reads ALTRADITS_API_BASE,
// ALTRADITS_API_KEY, ALTRADITS_WEBHOOK_SECRET from env (never the repo).
// Sandbox keys and the local fake only — no mainnet anywhere in this repo.

import type { AltraditsInvoice, AltraditsPaymentStatus } from "@/lib/altradits";
import {
  fakeCreateInvoice, fakeGetStatus, fakePay, fakeFeeBalance,
  regtestCreateInvoice, regtestGetStatus, regtestEnabled, type PayResult,
} from "./altradits-fake";

function base(): string {
  const raw = (process.env.ALTRADITS_API_BASE || "").trim().replace(/\/+$/, "");
  if (!raw) throw new Error("ALTRADITS_API_BASE is not set");
  const u = new URL(raw);
  if (u.username || u.password) throw new Error("bad ALTRADITS_API_BASE");
  const local = ["localhost", "127.0.0.1", "::1"].includes(u.hostname);
  if (u.protocol === "http:" && !local) throw new Error("API base must be https (http only for localhost)");
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("bad ALTRADITS_API_BASE");
  return raw;
}

function key(): string {
  const k = (process.env.ALTRADITS_API_KEY || "").trim();
  if (!k) throw new Error("ALTRADITS_API_KEY is not set");
  return k;
}

export function webhookSecret(): string {
  return (process.env.ALTRADITS_WEBHOOK_SECRET || "").trim();
}

export function destinationAddress(): string {
  return (process.env.YEBO_DESTINATION_ADDRESS || "yebo-demo@signet.example").trim();
}

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Altradits API ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export interface AltraditsPort {
  createInvoice: (amountSats: number, description: string) => Promise<AltraditsInvoice>;
  getStatus: (paymentHash: string) => Promise<AltraditsPaymentStatus>;
  pay: (invoiceOrAddress: string, amountSats: number) => Promise<PayResult>;
  feeBalance: () => Promise<number>;
  mode: "fake" | "fake+regtest" | "sandbox";
}

/** Fake by default (ALTRADITS_MODE=fake or no API key). Sandbox when a key is set. */
export function getAltradits(): AltraditsPort {
  const mode = (process.env.ALTRADITS_MODE || "fake").trim().toLowerCase();
  const hasKey = Boolean((process.env.ALTRADITS_API_KEY || "").trim());
  if (mode !== "fake" && hasKey) {
    return {
      mode: "sandbox",
      createInvoice: (amountSats, description) =>
        api<AltraditsInvoice>("POST", "/invoices", { amount_sats: amountSats, description, destination: destinationAddress() }),
      getStatus: (paymentHash) => api<AltraditsPaymentStatus>("GET", `/payments/${paymentHash}`),
      pay: (invoiceOrAddress, amountSats) =>
        api<PayResult>("POST", "/payments", { invoice_or_address: invoiceOrAddress, amount_sats: amountSats }),
      feeBalance: async () => {
        const r = await api<{ fee_balance_sats: number }>("GET", "/fee-balance");
        return r.fee_balance_sats;
      },
    };
  }
  if (regtestEnabled()) {
    return {
      mode: "fake+regtest",
      createInvoice: regtestCreateInvoice,
      getStatus: regtestGetStatus,
      pay: fakePay,
      feeBalance: async () => fakeFeeBalance(),
    };
  }
  return {
    mode: "fake",
    createInvoice: fakeCreateInvoice,
    getStatus: fakeGetStatus,
    pay: fakePay,
    feeBalance: async () => fakeFeeBalance(),
  };
}
