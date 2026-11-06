// Local fake implementing the Altradits Developer API contract for tests
// and dev (ALTRADITS_MODE=fake, the default). Same interface as the real
// HTTP client, in-memory store, deterministic test hooks. The ONLY place a
// direct LND connection is allowed, and only to regtest via LND_REGTEST_*
// env — never mainnet, never ~/.lnd-altradits.

import { randomBytes } from "node:crypto";
import type { AltraditsInvoice, AltraditsPaymentStatus } from "@/lib/altradits";

export interface PayResult {
  paymentHash: string;
  status: "settled" | "failed";
}

interface FakeInvoice {
  hash: string;
  amountSats: number;
  description: string;
  status: "pending" | "settled" | "failed";
  settledAt: string | null;
}

const invoices = new Map<string, FakeInvoice>();
let feeBalanceSats = 1_000_000; // prepaid demo fee balance
export const FEE_BPS = 50; // 0.5%

function fakeBolt11(hash: string, sats: number): string {
  // Clearly fake, testnet-shaped ("lntbs" = Lightning test bench signet).
  return `lntbs${sats}n1p${hash.slice(0, 16)}yebofake`;
}

export function fakeFeeFor(sats: number): number {
  return Math.max(1, Math.ceil((sats * FEE_BPS) / 10000));
}

export async function fakeCreateInvoice(amountSats: number, description: string): Promise<AltraditsInvoice> {
  const hash = randomBytes(32).toString("hex");
  invoices.set(hash, {
    hash, amountSats, description, status: "pending", settledAt: null,
  });
  return {
    invoice: fakeBolt11(hash, amountSats),
    paymentHash: hash,
    amountSats,
    expiresAt: new Date(Date.now() + 24 * 3600_000).toISOString(),
  };
}

export async function fakeGetStatus(paymentHash: string): Promise<AltraditsPaymentStatus> {
  const inv = invoices.get(paymentHash);
  if (!inv) {
    return { paymentHash, status: "unknown", amountSats: 0, settledAt: null };
  }
  return { paymentHash, status: inv.status, amountSats: inv.amountSats, settledAt: inv.settledAt };
}

/** Test/dev hook: mark an invoice settled (as if the test wallet paid it). */
export function fakeSettleInvoice(paymentHash: string): boolean {
  const inv = invoices.get(paymentHash);
  if (!inv || inv.status !== "pending") return false;
  inv.status = "settled";
  inv.settledAt = new Date().toISOString();
  feeBalanceSats = Math.max(0, feeBalanceSats - fakeFeeFor(inv.amountSats));
  return true;
}

export async function fakePay(_invoiceOrAddress: string, amountSats: number): Promise<PayResult> {
  void _invoiceOrAddress;
  const hash = randomBytes(32).toString("hex");
  feeBalanceSats = Math.max(0, feeBalanceSats - fakeFeeFor(amountSats));
  return { paymentHash: hash, status: "settled" };
}

export function fakeFeeBalance(): number {
  return feeBalanceSats;
}

export function resetFakeForTests(): void {
  invoices.clear();
  feeBalanceSats = 1_000_000;
}

// --- Optional regtest LND passthrough (fake internals only) -----------------
// Enabled only when LND_REGTEST_REST_URL + LND_REGTEST_INVOICE_MACAROON are
// set. Follows Altradits' lndRequest shape: Grpc-Metadata-macaroon header,
// optional TLS cert PEM/base64. Reads prefer the readonly macaroon.

function regtestOn(): boolean {
  return Boolean(process.env.LND_REGTEST_REST_URL && process.env.LND_REGTEST_INVOICE_MACAROON);
}

async function lndRegtest(method: string, path: string, body?: unknown, pay = false): Promise<unknown> {
  const { request } = await import("node:https");
  const base = new URL(process.env.LND_REGTEST_REST_URL as string);
  const macaroon = pay
    ? process.env.LND_REGTEST_PAY_MACAROON || process.env.LND_REGTEST_INVOICE_MACAROON
    : process.env.LND_REGTEST_READONLY_MACAROON || process.env.LND_REGTEST_INVOICE_MACAROON;
  let ca: string | undefined;
  const rawCert = (process.env.LND_REGTEST_TLS_CERT || "").trim();
  if (rawCert) {
    ca = rawCert.includes("BEGIN CERTIFICATE") ? rawCert.replace(/\\n/g, "\n") : Buffer.from(rawCert, "base64").toString("utf8");
  }
  const payload = body ? JSON.stringify(body) : undefined;
  return new Promise((resolve, reject) => {
    const req = request(
      {
        host: base.hostname,
        port: base.port || 443,
        method,
        path: base.pathname.replace(/\/$/, "") + path,
        ca,
        headers: {
          "Grpc-Metadata-macaroon": String(macaroon || "").trim(),
          "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        },
        timeout: 10000,
      },
      (res) => {
        let data = "";
        res.on("data", (c) => {
          data += c;
        });
        res.on("end", () => {
          try {
            const json = JSON.parse(data || "{}") as Record<string, unknown>;
            if ((res.statusCode || 500) >= 400) {
              reject(new Error(`regtest LND ${res.statusCode}: ${data.slice(0, 200)}`));
            } else {
              resolve(json);
            }
          } catch {
            reject(new Error(`regtest LND bad JSON: ${data.slice(0, 200)}`));
          }
        });
      },
    );
    req.on("timeout", () => req.destroy(new Error("regtest LND timed out")));
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

export async function regtestCreateInvoice(amountSats: number, description: string): Promise<AltraditsInvoice> {
  if (!regtestOn()) throw new Error("regtest LND not configured");
  const res = (await lndRegtest("POST", "/v1/invoices", { value: String(amountSats), memo: description })) as {
    payment_request?: string;
    r_hash?: string;
  };
  if (!res.payment_request || !res.r_hash) throw new Error("regtest LND invoice failed");
  const hash = Buffer.from(res.r_hash, "base64").toString("hex");
  invoices.set(hash, { hash, amountSats, description, status: "pending", settledAt: null });
  return {
    invoice: res.payment_request,
    paymentHash: hash,
    amountSats,
    expiresAt: new Date(Date.now() + 24 * 3600_000).toISOString(),
  };
}

export async function regtestGetStatus(paymentHash: string): Promise<AltraditsPaymentStatus> {
  if (!regtestOn()) throw new Error("regtest LND not configured");
  const res = (await lndRegtest("GET", `/v1/invoice/${paymentHash}`)) as {
    settled?: boolean;
    value?: string;
    settle_date?: string;
  };
  const settled = res.settled === true;
  const inv = invoices.get(paymentHash);
  if (inv && settled && inv.status === "pending") {
    inv.status = "settled";
    inv.settledAt = new Date(Number(res.settle_date || 0) * 1000).toISOString();
  }
  return {
    paymentHash,
    status: settled ? "settled" : "pending",
    amountSats: inv?.amountSats ?? Number(res.value || 0),
    settledAt: inv?.settledAt ?? null,
  };
}

export function regtestEnabled(): boolean {
  return regtestOn();
}
