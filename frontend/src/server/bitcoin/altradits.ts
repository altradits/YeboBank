// Altradits API integration — the live Bitcoin rail for YeboBank.
//
// Altradits ("Bitcoin in. M-Pesa out.") bridges Lightning sats and M-Pesa
// shillings in Kenya; its payout partner settles to the shop/user M-Pesa
// number for a 1% fee. YeboBank uses it for:
//   - Lightning invoices (deposits, agent float top-ups)
//   - Lightning payments (withdrawals, sends, pool deployments)
//   - KES <-> sats quotes (Altradits is the FX desk; LND has none)
//
// Contract note: Altradits has not published a versioned REST spec, so this
// client targets the conventional shape below against a configurable base URL
// (ALTRADITS_API_URL, default https://api.altradits.com) with a Bearer API key
// (ALTRADITS_API_KEY). Every endpoint + field is mapped in ONE place (the
// private methods), so adapting to the published spec is a contained edit.
// Without an API key the provider runs in transparent "sandbox" mode backed by
// the mock engine — same interface, clearly-marked fake data, zero network.

import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  BitcoinProvider, CreatedInvoice, CreateInvoiceParams, DecodedInvoice,
  InvoiceLookup, NodeInfo, OnchainAddress, PaymentResult, PayInvoiceParams,
  Quote, QuoteParams,
} from "./types";
import { BitcoinError } from "./types";
import {
  assertExpirySecs, assertLightningAmount, assertMemo, classifyDestination,
} from "./validate";
import { getStore } from "./store";
import { MockProvider } from "./mock";
import type { AltraditsConfig } from "./config";

interface AltInvoiceResponse {
  id: string;
  payment_request: string;
  payment_hash: string;
  amount_sats: number;
  memo?: string;
  expires_at: string;
  status: string;
}

interface AltStatusResponse {
  id: string;
  status: string;
  amount_sats: number;
  settled_at?: string;
}

interface AltPaymentResponse {
  id: string;
  status: string;
  amount_sats: number;
  fee_sats?: number;
  preimage?: string;
  failure_reason?: string;
}

interface AltQuoteResponse {
  from: Quote["from"];
  to: Quote["to"];
  amount: number;
  result: number;
  rate: number;
  fee_pct: number;
  fee_amount: number;
  source: string;
  expires_at: string;
}

function mapStatus(s: string): "open" | "settled" | "expired" | "failed" {
  const v = s.toLowerCase();
  if (v === "settled" || v === "paid" || v === "confirmed" || v === "complete") return "settled";
  if (v === "expired") return "expired";
  if (v === "failed" || v === "canceled" || v === "cancelled") return "failed";
  return "open";
}

function mapPaymentStatus(s: string): "pending" | "settled" | "failed" {
  const v = s.toLowerCase();
  if (v === "settled" || v === "paid" || v === "confirmed" || v === "complete" || v === "succeeded") return "settled";
  if (v === "failed" || v === "canceled" || v === "cancelled" || v === "declined") return "failed";
  return "pending";
}

/** Verify an Altradits webhook signature (HMAC-SHA256 of the raw body). */
export function verifyAltraditsWebhook(rawBody: string, signature: string | null, secret: string | null): boolean {
  if (!secret) return false; // no secret configured → accept nothing
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature.replace(/^sha256=/, ""), "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export class AltraditsProvider implements BitcoinProvider {
  readonly name = "altradits" as const;
  private readonly sandbox: MockProvider | null;

  constructor(private readonly cfg: AltraditsConfig) {
    this.sandbox = cfg.apiKey ? null : new MockProvider();
    if (this.sandbox) {
      console.warn("[altradits] No ALTRADITS_API_KEY — running in sandbox mode (simulated rail, no real funds move)");
    }
  }

  get mode(): "live" | "sandbox" {
    return this.sandbox ? "sandbox" : "live";
  }

  private async call<T>(method: "GET" | "POST", path: string, body?: unknown, idempotencyKey?: string): Promise<T> {
    if (!this.cfg.apiKey) throw new Error("unreachable: sandbox mode never calls the network");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.cfg.timeoutMs);
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.cfg.apiKey}`,
        "Content-Type": "application/json",
      };
      if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
      const res = await fetch(`${this.cfg.baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new BitcoinError(
          "ALTRADITS_REQUEST_FAILED",
          `Altradits ${method} ${path} failed (${res.status}): ${text.slice(0, 300) || res.statusText}`,
          502, res.status >= 500 || res.status === 429,
        );
      }
      return (await res.json()) as T;
    } catch (err) {
      if (err instanceof BitcoinError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      throw new BitcoinError("ALTRADITS_UNREACHABLE", `Cannot reach Altradits at ${this.cfg.baseUrl}: ${msg}`, 502, true);
    } finally {
      clearTimeout(timer);
    }
  }

  async getNodeInfo(): Promise<NodeInfo> {
    if (this.sandbox) {
      const mock = await this.sandbox.getNodeInfo();
      return { ...mock, alias: "Altradits (sandbox)", provider: "altradits", mode: "sandbox" };
    }
    // Altradits is a hosted rail, not our node — report rail health instead.
    const health = await this.call<{ block_height?: number; synced?: boolean; version?: string }>("GET", "/v1/status");
    return {
      alias: "Altradits",
      pubkey: "",
      blockHeight: health.block_height ?? 0,
      synced: health.synced ?? true,
      version: health.version,
      provider: "altradits",
      mode: "live",
    };
  }

  async createInvoice(params: CreateInvoiceParams): Promise<CreatedInvoice> {
    const amountSats = assertLightningAmount(params.amountSats);
    const memo = assertMemo(params.memo);
    const expirySecs = assertExpirySecs(params.expirySecs);
    if (this.sandbox) {
      const inv = await this.sandbox.createInvoice({ amountSats, memo, expirySecs, metadata: params.metadata });
      return { ...inv, provider: "altradits" };
    }
    const res = await this.call<AltInvoiceResponse>("POST", "/v1/lightning/invoices", {
      amount_sats: amountSats, memo: memo ?? "YeboBank deposit",
      expires_in: expirySecs, metadata: params.metadata ?? {},
    });
    getStore().saveInvoice({
      id: res.id, paymentHash: res.payment_hash, amountSats: res.amount_sats,
      memo: res.memo, status: mapStatus(res.status), provider: "altradits",
      createdAt: new Date().toISOString(), metadata: params.metadata,
    });
    return {
      id: res.id, paymentRequest: res.payment_request, paymentHash: res.payment_hash,
      amountSats: res.amount_sats, memo: res.memo, expiresAt: res.expires_at,
      status: mapStatus(res.status), provider: "altradits", raw: res,
    };
  }

  async lookupInvoice(idOrHash: string): Promise<InvoiceLookup> {
    if (this.sandbox) {
      const inv = await this.sandbox.lookupInvoice(idOrHash);
      return { ...inv, provider: "altradits" };
    }
    const res = await this.call<AltStatusResponse>("GET", `/v1/lightning/invoices/${encodeURIComponent(idOrHash)}`);
    const status = mapStatus(res.status);
    getStore().setInvoiceStatus(res.id, status, res.settled_at);
    return { id: res.id, status, amountSats: res.amount_sats, settledAt: res.settled_at, provider: "altradits" };
  }

  async decodeInvoice(paymentRequest: string): Promise<DecodedInvoice> {
    if (this.sandbox) return this.sandbox.decodeInvoice(paymentRequest);
    const res = await this.call<{
      payment_hash: string; amount_sats: number; memo?: string;
      expires_at?: string; payee_pubkey?: string; expired: boolean;
    }>("GET", `/v1/lightning/decode?invoice=${encodeURIComponent(paymentRequest.trim())}`);
    return {
      paymentHash: res.payment_hash, amountSats: res.amount_sats, memo: res.memo,
      expiresAt: res.expires_at, payeePubkey: res.payee_pubkey, expired: res.expired,
    };
  }

  async payInvoice(params: PayInvoiceParams): Promise<PaymentResult> {
    const amountSats = assertLightningAmount(params.amountSats);
    const dest = params.paymentRequest ?? params.lightningAddress ?? "";
    const { kind, value } = classifyDestination(dest);
    if (this.sandbox) {
      const p = await this.sandbox.payInvoice({ ...params, amountSats });
      return { ...p, provider: "altradits" };
    }
    if (params.idempotencyKey) {
      const existing = getStore().findPaymentByKey(params.idempotencyKey);
      if (existing) {
        return { id: existing.id, status: existing.status, amountSats: existing.amountSats, provider: "altradits" };
      }
    }
    const res = await this.call<AltPaymentResponse>(
      "POST", "/v1/lightning/payments",
      kind === "bolt11"
        ? { invoice: value, amount_sats: amountSats, memo: params.memo, fee_limit_sats: params.feeLimitSats }
        : { lightning_address: value, amount_sats: amountSats, memo: params.memo, fee_limit_sats: params.feeLimitSats },
      params.idempotencyKey,
    );
    const status = mapPaymentStatus(res.status);
    getStore().savePayment({
      id: res.id, status, amountSats: res.amount_sats, destination: value,
      idempotencyKey: params.idempotencyKey, createdAt: new Date().toISOString(),
      failureReason: res.failure_reason,
    });
    return {
      id: res.id, status, amountSats: res.amount_sats, feeSats: res.fee_sats,
      preimage: res.preimage, provider: "altradits",
      failureReason: res.failure_reason, raw: res,
    };
  }

  async lookupPayment(id: string): Promise<PaymentResult> {
    if (this.sandbox) {
      const p = await this.sandbox.lookupPayment(id);
      return { ...p, provider: "altradits" };
    }
    const res = await this.call<AltPaymentResponse>("GET", `/v1/lightning/payments/${encodeURIComponent(id)}`);
    const status = mapPaymentStatus(res.status);
    getStore().setPaymentStatus(res.id, status, res.failure_reason);
    return {
      id: res.id, status, amountSats: res.amount_sats, feeSats: res.fee_sats,
      preimage: res.preimage, provider: "altradits", failureReason: res.failure_reason, raw: res,
    };
  }

  async newOnchainAddress(): Promise<OnchainAddress> {
    if (this.sandbox) {
      const a = await this.sandbox.newOnchainAddress();
      return { ...a, provider: "altradits" };
    }
    const res = await this.call<{ address: string }>("POST", "/v1/bitcoin/addresses", {});
    return { address: res.address, provider: "altradits" };
  }

  async getQuote(params: QuoteParams): Promise<Quote> {
    if (this.sandbox) return this.sandbox.getQuote(params);
    if (params.amount <= 0 || !Number.isFinite(params.amount)) {
      throw new BitcoinError("VALIDATION_ERROR", "amount must be a positive number", 400, false);
    }
    const qs = new URLSearchParams({ from: params.from, to: params.to, amount: String(params.amount) });
    const res = await this.call<AltQuoteResponse>("GET", `/v1/quotes?${qs.toString()}`);
    return {
      from: res.from, to: res.to, amount: res.amount, result: res.result, rate: res.rate,
      feePct: res.fee_pct, feeAmount: res.fee_amount, source: res.source || "altradits",
      expiresAt: res.expires_at,
    };
  }
}
