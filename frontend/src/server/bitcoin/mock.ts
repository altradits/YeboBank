// In-memory mock provider. Used when BITCOIN_PROVIDER=mock and as the
// sandbox fallback inside the Altradits provider when no API key is set.
// Invoices are real-shaped but NOT payable on any network — every payment
// request contains the marker "yebomock" so it can never be confused with a
// real BOLT11 invoice.

import { createHash, randomBytes } from "node:crypto";
import type {
  BitcoinProvider, CreatedInvoice, CreateInvoiceParams, DecodedInvoice,
  InvoiceLookup, NodeInfo, OnchainAddress, PaymentResult, PayInvoiceParams,
  Quote, QuoteParams,
} from "./types";
import { BitcoinError } from "./types";
import { assertExpirySecs, assertLightningAmount, assertMemo, classifyDestination } from "./validate";
import { getStore } from "./store";

export const MOCK_BTC_USD = 98500;
export const MOCK_USD_KES = 129.5;
// 0.5% per the canonical Developer API contract (docs/ALTRADITS_CONTRACT.md).
export const MOCK_FEE_PCT = 0.5;

function satsPerKes(): number {
  return 1e8 / (MOCK_BTC_USD * MOCK_USD_KES);
}

/** Shared fixed-rate FX math for offline/sandbox quotes (no network). */
export function fixedRateQuote(
  params: QuoteParams,
  feePct: number,
  source: string,
): Quote {
  if (params.amount <= 0 || !Number.isFinite(params.amount)) {
    throw new BitcoinError("VALIDATION_ERROR", "amount must be a positive number", 400, false);
  }
  const toSats = (amount: number, cur: QuoteParams["from"]): number => {
    if (cur === "SATS") return amount;
    if (cur === "BTC") return Math.round(amount * 1e8);
    return Math.round(amount * satsPerKes());
  };
  const fromSats = (sats: number, cur: QuoteParams["to"]): number => {
    if (cur === "SATS") return Math.round(sats);
    if (cur === "BTC") return sats / 1e8;
    return sats / satsPerKes();
  };
  const grossSats = toSats(params.amount, params.from);
  const feeSats = Math.round(grossSats * (feePct / 100));
  const netSats = grossSats - feeSats;
  const result = fromSats(netSats, params.to);
  return {
    from: params.from, to: params.to, amount: params.amount, result,
    rate: params.amount > 0 ? result / params.amount : 0,
    feePct,
    feeAmount: fromSats(feeSats, params.to),
    source,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };
}

function fakePaymentHash(): string {
  return createHash("sha256").update(randomBytes(32)).digest("hex");
}

/** Clearly-fake invoice string. Fails real BOLT11 checksum by design. */
function fakeBolt11(amountSats: number, hash: string): string {
  const body = Buffer.from(`yebomock:${amountSats}:${hash}`).toString("hex").slice(0, 120);
  return `lnbc${amountSats}n1pyebomock${body}`;
}

export class MockProvider implements BitcoinProvider {
  readonly name = "mock" as const;

  async getNodeInfo(): Promise<NodeInfo> {
    return {
      alias: "YeboBank-mock",
      pubkey: "mock".padEnd(66, "0"),
      blockHeight: 870000,
      synced: true,
      version: "mock-0.1",
      provider: "mock",
      mode: "sandbox",
      balanceSats: { onchain: 50_000_000, lightning: 20_000_000 },
    };
  }

  async createInvoice(params: CreateInvoiceParams): Promise<CreatedInvoice> {
    const amountSats = assertLightningAmount(params.amountSats);
    const memo = assertMemo(params.memo);
    const expirySecs = assertExpirySecs(params.expirySecs);
    const paymentHash = fakePaymentHash();
    const id = `mock_${paymentHash.slice(0, 16)}`;
    const expiresAt = new Date(Date.now() + expirySecs * 1000).toISOString();
    getStore().saveInvoice({
      id, paymentHash, amountSats, memo, status: "open", provider: "mock",
      createdAt: new Date().toISOString(), metadata: params.metadata,
    });
    return {
      id, paymentRequest: fakeBolt11(amountSats, paymentHash), paymentHash,
      amountSats, memo, expiresAt, status: "open", provider: "mock",
    };
  }

  async lookupInvoice(idOrHash: string): Promise<InvoiceLookup> {
    const inv = getStore().getInvoice(idOrHash);
    if (!inv) throw new BitcoinError("INVOICE_NOT_FOUND", `Unknown invoice ${idOrHash}`, 404, false);
    return { id: inv.id, status: inv.status, amountSats: inv.amountSats, settledAt: inv.settledAt, provider: "mock" };
  }

  async decodeInvoice(paymentRequest: string): Promise<DecodedInvoice> {
    const v = (paymentRequest ?? "").trim();
    if (!v.toLowerCase().startsWith("lnbc")) {
      throw new BitcoinError("DECODE_FAILED", "Not a BOLT11 invoice", 400, false);
    }
    const m = /^lnbc(\d+)n1/i.exec(v);
    return {
      paymentHash: fakePaymentHash(),
      amountSats: m ? Number(m[1]) : 0,
      memo: "mock invoice",
      payeePubkey: "mock".padEnd(66, "0"),
      expired: false,
    };
  }

  async payInvoice(params: PayInvoiceParams): Promise<PaymentResult> {
    const amountSats = assertLightningAmount(params.amountSats);
    const dest = params.paymentRequest ?? params.lightningAddress ?? "";
    const { value } = classifyDestination(dest);
    if (params.idempotencyKey) {
      const existing = getStore().findPaymentByKey(params.idempotencyKey);
      if (existing) {
        return { id: existing.id, status: existing.status, amountSats: existing.amountSats, provider: "mock" };
      }
    }
    const id = `mockpay_${randomBytes(8).toString("hex")}`;
    getStore().savePayment({
      id, status: "settled", amountSats, destination: value,
      idempotencyKey: params.idempotencyKey, createdAt: new Date().toISOString(),
    });
    return { id, status: "settled", amountSats, feeSats: 0, provider: "mock" };
  }

  async lookupPayment(id: string): Promise<PaymentResult> {
    const p = getStore().getPayment(id);
    if (!p) throw new BitcoinError("PAYMENT_NOT_FOUND", `Unknown payment ${id}`, 404, false);
    return { id: p.id, status: p.status, amountSats: p.amountSats, provider: "mock", failureReason: p.failureReason };
  }

  async newOnchainAddress(): Promise<OnchainAddress> {
    // Regtest-style address — cannot receive mainnet funds by design.
    const suffix = randomBytes(20).toString("hex");
    return { address: `bcrt1qyebomock${suffix.slice(0, 28)}`, provider: "mock" };
  }

  async getQuote(params: QuoteParams): Promise<Quote> {
    return fixedRateQuote(params, MOCK_FEE_PCT, "mock-fixed-rate");
  }

  /** Test/dev helper: mark a mock invoice settled (simulates the payer). */
  settleInvoice(idOrHash: string): void {
    const updated = getStore().setInvoiceStatus(idOrHash, "settled", new Date().toISOString());
    if (!updated) throw new BitcoinError("INVOICE_NOT_FOUND", `Unknown invoice ${idOrHash}`, 404, false);
  }
}
