// Altradits Developer API (/api/dev/v1) contract: shared types and webhook
// signing. Server-only (uses node:crypto); the browser never imports this —
// it talks to /api routes instead. YeboBank is a reference integration:
// deposits go to YeboBank's destination Lightning address, credits land via
// signed webhooks, idempotent by payment hash. Full contract in
// docs/ALTRADITS_CONTRACT.md.

import { createHmac, timingSafeEqual } from "node:crypto";

export type AltraditsPaymentState = "pending" | "settled" | "failed" | "unknown";

export interface AltraditsInvoice {
  invoice: string;
  paymentHash: string;
  amountSats: number;
  expiresAt: string;
}

export interface AltraditsPaymentStatus {
  paymentHash: string;
  status: AltraditsPaymentState;
  amountSats: number;
  settledAt: string | null;
}

export interface AltraditsWebhookEvent {
  event: "invoice.settled";
  paymentHash: string;
  amountSats: number;
}

export const WEBHOOK_REPLAY_WINDOW_MS = 5 * 60_000;

/** HMAC-SHA256 hex of `${timestamp}.${rawBody}` (Altradits bitika convention). */
export function signWebhook(secret: string, timestamp: string, rawBody: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

export function verifyWebhookSignature(
  secret: string,
  timestamp: string,
  rawBody: string,
  signature: string,
  nowMs = Date.now(),
): boolean {
  if (!secret || !timestamp || !signature) return false;
  const ts = Number(timestamp);
  if (!Number.isSafeInteger(ts) || Math.abs(nowMs - ts) > WEBHOOK_REPLAY_WINDOW_MS) return false;
  const expected = signWebhook(secret, timestamp, rawBody);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function parseWebhookEvent(body: unknown): AltraditsWebhookEvent | null {
  if (!body || typeof body !== "object") return null;
  const e = body as Record<string, unknown>;
  if (e.event !== "invoice.settled") return null;
  if (typeof e.paymentHash !== "string" || !/^[0-9a-f]{64}$/.test(e.paymentHash)) return null;
  if (typeof e.amountSats !== "number" || !Number.isSafeInteger(e.amountSats) || e.amountSats <= 0) {
    return null;
  }
  return { event: "invoice.settled", paymentHash: e.paymentHash, amountSats: e.amountSats };
}
