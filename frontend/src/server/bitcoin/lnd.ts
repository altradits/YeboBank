// LND node integration via the LND REST API.
// Docs: https://lightning.engineering/api-docs/api/lnd/
//
// Required env: LND_REST_URL + LND_MACAROON_HEX (see docs/LND.md for how to
// bake a minimal macaroon). The bank needs only:
//   invoices:read/write, router:read/write, onchain:read/write, info:read.
// Nothing here touches wallet unlocking or channel management — the node
// operator keeps full custody of the node; YeboBank only invoices and pays.
//
// TLS: production nodes sit behind a reverse proxy with a valid cert. For a
// node with a self-signed cert in development, set LND_ALLOW_INSECURE_TLS=true
// (dev only — the constructor refuses it when NODE_ENV=production).

import type {
  BitcoinProvider, CreatedInvoice, CreateInvoiceParams, DecodedInvoice,
  InvoiceLookup, NodeInfo, OnchainAddress, PaymentResult, PayInvoiceParams,
  Quote, QuoteParams,
} from "./types";
import { BitcoinError, isBitcoinError, QuoteUnsupportedError } from "./types";
import {
  assertBolt11, assertExpirySecs, assertLightningAmount, assertMemo, classifyDestination,
} from "./validate";
import { getStore } from "./store";
import type { LndConfig } from "./config";

interface LndInvoiceResponse {
  payment_request?: string;
  payment_hash?: string;
  add_index?: string;
}

interface LndLookupResponse {
  state?: string; // OPEN | SETTLED | CANCELED | ACCEPTED
  value?: string;
  settle_date?: string;
  payment_request?: string;
  memo?: string;
}

interface LndPayReqResponse {
  payment_hash?: string;
  num_satoshis?: string;
  description?: string;
  timestamp?: string;
  expiry?: string;
  destination?: string;
}

interface LndInfoResponse {
  alias?: string;
  identity_pubkey?: string;
  block_height?: number;
  synced_to_chain?: boolean;
  synced_to_graph?: boolean;
  version?: string;
}

interface LndSendResponse {
  payment_hash?: string;
  payment_preimage?: string;
  payment_route?: { total_fees?: string };
  failure_reason?: string;
}

export class LndProvider implements BitcoinProvider {
  readonly name = "lnd" as const;
  private warnedInsecureTls = false;

  constructor(private readonly cfg: LndConfig) {
    if (!cfg.restUrl || !cfg.macaroonHex) {
      throw new BitcoinError(
        "LND_NOT_CONFIGURED",
        "LND_REST_URL and LND_MACAROON_HEX must both be set to use the LND provider (see docs/LND.md)",
        500, false,
      );
    }
    if (cfg.allowInsecureTls && process.env.NODE_ENV === "production") {
      throw new BitcoinError(
        "LND_INSECURE_TLS",
        "LND_ALLOW_INSECURE_TLS must never be true in production — terminate TLS with a valid cert",
        500, false,
      );
    }
  }

  private async call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
    if (this.cfg.allowInsecureTls) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
      if (!this.warnedInsecureTls) {
        this.warnedInsecureTls = true;
        console.warn("[lnd] WARNING: TLS verification disabled (LND_ALLOW_INSECURE_TLS=true, dev only)");
      }
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.cfg.timeoutMs);
    try {
      const res = await fetch(`${this.cfg.restUrl}${path}`, {
        method,
        headers: {
          "Grpc-Metadata-macaroon": this.cfg.macaroonHex,
          "Content-Type": "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new BitcoinError(
          "LND_REQUEST_FAILED",
          `LND ${method} ${path} failed (${res.status}): ${text.slice(0, 300) || res.statusText}`,
          502, res.status >= 500,
        );
      }
      return (await res.json()) as T;
    } catch (err) {
      if (isBitcoinError(err)) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      throw new BitcoinError("LND_UNREACHABLE", `Cannot reach LND at ${this.cfg.restUrl}: ${msg}`, 502, true);
    } finally {
      clearTimeout(timer);
    }
  }

  async getNodeInfo(): Promise<NodeInfo> {
    const info = await this.call<LndInfoResponse>("GET", "/v1/getinfo");
    return {
      alias: info.alias ?? "lnd",
      pubkey: info.identity_pubkey ?? "",
      blockHeight: info.block_height ?? 0,
      synced: Boolean(info.synced_to_chain && info.synced_to_graph),
      version: info.version,
      provider: "lnd",
      mode: "live",
    };
  }

  async createInvoice(params: CreateInvoiceParams): Promise<CreatedInvoice> {
    const amountSats = assertLightningAmount(params.amountSats);
    const memo = assertMemo(params.memo) ?? "YeboBank deposit";
    const expirySecs = assertExpirySecs(params.expirySecs);
    const res = await this.call<LndInvoiceResponse>("POST", "/v1/invoices", {
      value: String(amountSats),
      memo,
      expiry: String(expirySecs),
    });
    if (!res.payment_request || !res.payment_hash) {
      throw new BitcoinError("LND_BAD_RESPONSE", "LND returned an invoice without payment_request", 502, false);
    }
    const expiresAt = new Date(Date.now() + expirySecs * 1000).toISOString();
    getStore().saveInvoice({
      id: res.payment_hash, paymentHash: res.payment_hash, amountSats, memo,
      status: "open", provider: "lnd", createdAt: new Date().toISOString(), metadata: params.metadata,
    });
    return {
      id: res.payment_hash, paymentRequest: res.payment_request, paymentHash: res.payment_hash,
      amountSats, memo, expiresAt, status: "open", provider: "lnd",
    };
  }

  async lookupInvoice(idOrHash: string): Promise<InvoiceLookup> {
    const hash = idOrHash.trim();
    if (!/^[0-9a-f]{64}$/i.test(hash)) {
      // Fall back to the local record for non-hash ids.
      const inv = getStore().getInvoice(hash);
      if (!inv) throw new BitcoinError("INVOICE_NOT_FOUND", `Unknown invoice ${hash}`, 404, false);
      return { id: inv.id, status: inv.status, amountSats: inv.amountSats, settledAt: inv.settledAt, provider: "lnd" };
    }
    const inv = await this.call<LndLookupResponse>("GET", `/v1/invoice/${hash}`);
    const status =
      inv.state === "SETTLED" ? "settled"
      : inv.state === "CANCELED" ? "failed"
      : "open";
    const settledAt =
      status === "settled" && inv.settle_date && inv.settle_date !== "0"
        ? new Date(Number(inv.settle_date) * 1000).toISOString()
        : undefined;
    getStore().setInvoiceStatus(hash, status, settledAt);
    return { id: hash, status, amountSats: Number(inv.value ?? 0), settledAt, provider: "lnd" };
  }

  async decodeInvoice(paymentRequest: string): Promise<DecodedInvoice> {
    const pr = assertBolt11(paymentRequest);
    const d = await this.call<LndPayReqResponse>("GET", `/v1/payreq/${encodeURIComponent(pr)}`);
    const ts = Number(d.timestamp ?? 0);
    const expiry = Number(d.expiry ?? 3600);
    const expiresAt = ts ? new Date((ts + expiry) * 1000).toISOString() : undefined;
    return {
      paymentHash: d.payment_hash ?? "",
      amountSats: Number(d.num_satoshis ?? 0),
      memo: d.description,
      expiresAt,
      payeePubkey: d.destination,
      expired: expiresAt ? Date.now() > new Date(expiresAt).getTime() : false,
    };
  }

  async payInvoice(params: PayInvoiceParams): Promise<PaymentResult> {
    const amountSats = assertLightningAmount(params.amountSats);
    if (params.lightningAddress && !params.paymentRequest) {
      throw new BitcoinError(
        "LIGHTNING_ADDRESS_UNSUPPORTED",
        "LND pays BOLT11 invoices directly — resolve the Lightning address to an invoice first (see /api/lnurlp/callback)",
        400, false,
      );
    }
    if (!params.paymentRequest) throw new BitcoinError("VALIDATION_ERROR", "paymentRequest is required", 400, false);
    const pr = assertBolt11(params.paymentRequest);
    if (params.idempotencyKey) {
      const existing = getStore().findPaymentByKey(params.idempotencyKey);
      if (existing) {
        return { id: existing.id, status: existing.status, amountSats: existing.amountSats, provider: "lnd" };
      }
    }
    // Safety: never pay an invoice whose amount differs from the approved amount.
    const decoded = await this.decodeInvoice(pr);
    if (decoded.amountSats > 0 && decoded.amountSats !== amountSats) {
      throw new BitcoinError(
        "AMOUNT_MISMATCH",
        `Invoice is for ${decoded.amountSats} sats but payment approved ${amountSats} sats — refusing to pay`,
        400, false,
      );
    }
    if (decoded.expired) throw new BitcoinError("INVOICE_EXPIRED", "Invoice has expired", 400, false);

    const res = await this.call<LndSendResponse>("POST", "/v2/router/send", {
      payment_request: pr,
      timeout_seconds: 60,
      fee_limit_sat: String(params.feeLimitSats ?? Math.max(10, Math.ceil(amountSats * 0.01))),
    });
    if (res.failure_reason && res.failure_reason !== "FAILURE_REASON_NONE") {
      const id = `lndpay_${(res.payment_hash ?? "unknown").slice(0, 16)}`;
      getStore().savePayment({
        id, status: "failed", amountSats, destination: pr,
        idempotencyKey: params.idempotencyKey, createdAt: new Date().toISOString(),
        failureReason: res.failure_reason,
      });
      return { id, status: "failed", amountSats, provider: "lnd", failureReason: res.failure_reason };
    }
    const id = `lndpay_${(res.payment_hash ?? pr.slice(-16)).slice(0, 32)}`;
    getStore().savePayment({
      id, status: "settled", amountSats, destination: pr,
      idempotencyKey: params.idempotencyKey, createdAt: new Date().toISOString(),
    });
    return {
      id, status: "settled", amountSats,
      feeSats: Number(res.payment_route?.total_fees ?? 0),
      preimage: res.payment_preimage, provider: "lnd",
    };
  }

  async lookupPayment(id: string): Promise<PaymentResult> {
    const p = getStore().getPayment(id);
    if (p) {
      return { id: p.id, status: p.status, amountSats: p.amountSats, provider: "lnd", failureReason: p.failureReason };
    }
    // LND payment lookup by hash: GET /v1/payments requires the full payment list
    // scan; the local record is authoritative for payments made via this server.
    void classifyDestination; // (kept import stable — address resolution lives in the route layer)
    throw new BitcoinError("PAYMENT_NOT_FOUND", `Unknown payment ${id}`, 404, false);
  }

  async newOnchainAddress(): Promise<OnchainAddress> {
    const res = await this.call<{ address?: string }>("GET", "/v1/new_address?type=0");
    if (!res.address) throw new BitcoinError("LND_BAD_RESPONSE", "LND returned no address", 502, false);
    return { address: res.address, provider: "lnd" };
  }

  async getQuote(_params: QuoteParams): Promise<Quote> {
    void _params;
    // LND is a Lightning node, not an FX desk. Quotes always come from the
    // Altradits provider (or the fixed-rate fallback) — see getQuoteWithFallback.
    throw new QuoteUnsupportedError("lnd");
  }
}
