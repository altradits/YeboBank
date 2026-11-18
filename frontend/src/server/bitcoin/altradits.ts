// Altradits provider — adapter over the canonical Developer API port.
//
// The wire contract lives in ONE place: docs/ALTRADITS_CONTRACT.md, implemented
// by src/server/altradits.ts (sandbox HTTP client) and
// src/server/altradits-fake.ts (in-memory fake + optional regtest). This file
// only translates that port onto the BitcoinProvider interface so Lightning
// routes can switch rails (LND / Altradits / mock) without code changes.
//
// Mode selection is the port's: ALTRADITS_MODE=fake (default) or no API key
// → sandbox fake; a key plus any other mode → live sandbox server.
// Webhook verification is NOT here — the canonical verifier is
// verifyWebhookSignature in src/lib/altradits.ts, used by
// /api/webhooks/altradits (the settlement path that credits the ledger).

import type {
  BitcoinProvider, CreatedInvoice, CreateInvoiceParams, DecodedInvoice,
  InvoiceLookup, NodeInfo, OnchainAddress, PaymentResult, PayInvoiceParams,
  Quote, QuoteParams,
} from "./types";
import { BitcoinError, isBitcoinError } from "./types";
import {
  assertExpirySecs, assertLightningAmount, assertMemo, classifyDestination,
} from "./validate";
import { getStore } from "./store";
import { fixedRateQuote, MOCK_FEE_PCT } from "./mock";
import { getAltradits } from "../altradits";
import type { AltraditsConfig } from "./config";

function mapInvoiceStatus(s: string): "open" | "settled" | "expired" | "failed" {
  if (s === "settled") return "settled";
  if (s === "failed") return "failed";
  return "open"; // pending
}

export class AltraditsProvider implements BitcoinProvider {
  readonly name = "altradits" as const;

  // Config is informational (status endpoint); the port reads env directly so
  // the adapter can never diverge from the canonical client.
  constructor(private readonly cfg: AltraditsConfig) {
    void this.cfg;
    if (!this.configuredLive()) {
      console.warn("[altradits] No live sandbox configured (need ALTRADITS_API_KEY + ALTRADITS_MODE≠fake) — sandbox fake, no real funds move");
    }
  }

  private configuredLive(): boolean {
    return Boolean(process.env.ALTRADITS_API_KEY?.trim()) &&
      (process.env.ALTRADITS_MODE || "fake").trim().toLowerCase() !== "fake";
  }

  get mode(): "live" | "sandbox" {
    return this.configuredLive() ? "live" : "sandbox";
  }

  private translateError(e: unknown, op: string): never {
    if (isBitcoinError(e)) throw e;
    throw new BitcoinError("ALTRADITS_REQUEST_FAILED", `Altradits ${op} failed: ${e instanceof Error ? e.message : String(e)}`, 502, true);
  }

  async getNodeInfo(): Promise<NodeInfo> {
    const port = getAltradits();
    return {
      alias: port.mode === "sandbox" ? "Altradits" : `Altradits (${port.mode})`,
      pubkey: "",
      blockHeight: 0,
      synced: true,
      provider: "altradits",
      mode: port.mode === "sandbox" ? "live" : "sandbox",
    };
  }

  async createInvoice(params: CreateInvoiceParams): Promise<CreatedInvoice> {
    const amountSats = assertLightningAmount(params.amountSats);
    const memo = assertMemo(params.memo) ?? "YeboBank deposit";
    assertExpirySecs(params.expirySecs); // validated; expiry is set by the Altradits side
    try {
      const inv = await getAltradits().createInvoice(amountSats, memo);
      getStore().saveInvoice({
        id: inv.paymentHash, paymentHash: inv.paymentHash, amountSats: inv.amountSats,
        memo, status: "open", provider: "altradits",
        createdAt: new Date().toISOString(), metadata: params.metadata,
      });
      return {
        id: inv.paymentHash, paymentRequest: inv.invoice, paymentHash: inv.paymentHash,
        amountSats: inv.amountSats, memo, expiresAt: inv.expiresAt,
        status: "open", provider: "altradits",
      };
    } catch (e) {
      this.translateError(e, "createInvoice");
    }
  }

  async lookupInvoice(idOrHash: string): Promise<InvoiceLookup> {
    try {
      const st = await getAltradits().getStatus(idOrHash.trim());
      if (st.status === "unknown") {
        throw new BitcoinError("INVOICE_NOT_FOUND", `Unknown invoice ${idOrHash}`, 404, false);
      }
      const status = mapInvoiceStatus(st.status);
      getStore().setInvoiceStatus(st.paymentHash, status, st.settledAt ?? undefined);
      return {
        id: st.paymentHash, status, amountSats: st.amountSats,
        settledAt: st.settledAt ?? undefined, provider: "altradits",
      };
    } catch (e) {
      this.translateError(e, "lookupInvoice");
    }
  }

  async decodeInvoice(_paymentRequest: string): Promise<DecodedInvoice> {
    void _paymentRequest;
    // The Developer API contract has no decode endpoint (decode via LND).
    throw new BitcoinError("DECODE_UNSUPPORTED", "Altradits has no invoice-decode endpoint — switch BITCOIN_PROVIDER=lnd for decode", 501, false);
  }

  async payInvoice(params: PayInvoiceParams): Promise<PaymentResult> {
    const amountSats = assertLightningAmount(params.amountSats);
    const dest = params.paymentRequest ?? params.lightningAddress ?? "";
    const { value } = classifyDestination(dest);
    if (params.idempotencyKey) {
      const existing = getStore().findPaymentByKey(params.idempotencyKey);
      if (existing) {
        return { id: existing.id, status: existing.status, amountSats: existing.amountSats, provider: "altradits" };
      }
    }
    try {
      const res = await getAltradits().pay(value, amountSats);
      const status = res.status === "settled" ? "settled" : "failed";
      const id = `altpay_${res.paymentHash.slice(0, 16)}`;
      getStore().savePayment({
        id, status, amountSats, destination: value,
        idempotencyKey: params.idempotencyKey, createdAt: new Date().toISOString(),
      });
      return { id, status, amountSats, provider: "altradits" };
    } catch (e) {
      this.translateError(e, "payInvoice");
    }
  }

  async lookupPayment(id: string): Promise<PaymentResult> {
    const p = getStore().getPayment(id);
    if (!p) throw new BitcoinError("PAYMENT_NOT_FOUND", `Unknown payment ${id}`, 404, false);
    return { id: p.id, status: p.status, amountSats: p.amountSats, provider: "altradits", failureReason: p.failureReason };
  }

  async newOnchainAddress(): Promise<OnchainAddress> {
    // The Developer API contract is Lightning-only (on-chain via LND).
    throw new BitcoinError("ADDRESS_UNSUPPORTED", "Altradits has no on-chain addresses — switch BITCOIN_PROVIDER=lnd for on-chain", 501, false);
  }

  async getQuote(params: QuoteParams): Promise<Quote> {
    // The contract prices in sats with a 0.5% fee draw; KES↔sats math is the
    // shared fixed-rate fallback until a live FX feed lands in the contract.
    const live = this.configuredLive();
    return fixedRateQuote(params, MOCK_FEE_PCT, live ? "altradits-fixed-rate" : "altradits-sandbox-fixed-rate");
  }
}
