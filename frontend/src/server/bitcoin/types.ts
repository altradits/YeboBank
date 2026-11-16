// Shared Bitcoin provider contract for YeboBank.
//
// Every Lightning / on-chain rail (LND node, Altradits API, in-memory mock)
// implements `BitcoinProvider`. API routes and UI code depend ONLY on this
// interface, so switching rails is a one-line env change (BITCOIN_PROVIDER)
// with zero UI edits.

export type BitcoinProviderName = "lnd" | "altradits" | "mock";

export type InvoiceStatusValue = "open" | "settled" | "expired" | "failed";
export type PaymentStatusValue = "pending" | "settled" | "failed";

export interface CreateInvoiceParams {
  amountSats: number;
  memo?: string;
  /** Invoice expiry in seconds. Defaults to 3600 (1h). */
  expirySecs?: number;
  /** Opaque key/value pairs stored alongside the invoice (user id, lock id...). */
  metadata?: Record<string, string>;
}

export interface CreatedInvoice {
  /** Provider-side id (payment hash for LND, invoice id for Altradits/mock). */
  id: string;
  paymentRequest: string;
  paymentHash: string;
  amountSats: number;
  memo?: string;
  expiresAt: string; // ISO
  status: InvoiceStatusValue;
  provider: BitcoinProviderName;
  raw?: unknown;
}

export interface PayInvoiceParams {
  /** BOLT11 invoice. Exactly one of paymentRequest / lightningAddress is required. */
  paymentRequest?: string;
  /** user@domain — resolved via LNURL-pay before paying. */
  lightningAddress?: string;
  /** Expected amount in sats. Must match the invoice amount when paying BOLT11. */
  amountSats: number;
  memo?: string;
  /** Max routing fee the bank accepts. Defaults per provider. */
  feeLimitSats?: number;
  /** Client-supplied idempotency key — retries with the same key return the first result. */
  idempotencyKey?: string;
}

export interface PaymentResult {
  id: string;
  status: PaymentStatusValue;
  amountSats: number;
  feeSats?: number;
  preimage?: string;
  provider: BitcoinProviderName;
  failureReason?: string;
  raw?: unknown;
}

export interface DecodedInvoice {
  paymentHash: string;
  amountSats: number;
  memo?: string;
  expiresAt?: string;
  payeePubkey?: string;
  expired: boolean;
}

export interface OnchainAddress {
  address: string;
  provider: BitcoinProviderName;
}

export interface NodeInfo {
  alias: string;
  pubkey: string;
  blockHeight: number;
  synced: boolean;
  version?: string;
  provider: BitcoinProviderName;
  /** "live" = talking to a real backend, "sandbox" = no credentials, simulated. */
  mode: "live" | "sandbox";
  balanceSats?: { onchain: number; lightning: number };
}

export interface QuoteParams {
  from: "KES" | "SATS" | "BTC";
  to: "KES" | "SATS" | "BTC";
  amount: number;
}

export interface Quote {
  from: QuoteParams["from"];
  to: QuoteParams["to"];
  amount: number;
  result: number;
  rate: number;
  feePct: number;
  feeAmount: number;
  source: string;
  expiresAt: string; // ISO
}

export interface InvoiceLookup {
  id: string;
  status: InvoiceStatusValue;
  amountSats: number;
  settledAt?: string;
  provider: BitcoinProviderName;
}

export interface BitcoinProvider {
  readonly name: BitcoinProviderName;
  getNodeInfo(): Promise<NodeInfo>;
  createInvoice(params: CreateInvoiceParams): Promise<CreatedInvoice>;
  lookupInvoice(idOrHash: string): Promise<InvoiceLookup>;
  decodeInvoice(paymentRequest: string): Promise<DecodedInvoice>;
  payInvoice(params: PayInvoiceParams): Promise<PaymentResult>;
  lookupPayment(id: string): Promise<PaymentResult>;
  newOnchainAddress(): Promise<OnchainAddress>;
  /** FX quote. Providers without an FX desk throw QuoteUnsupportedError. */
  getQuote(params: QuoteParams): Promise<Quote>;
}

export class BitcoinError extends Error {
  code: string;
  status: number;
  retryable: boolean;
  constructor(code: string, message: string, status = 502, retryable = false) {
    super(message);
    this.name = "BitcoinError";
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

export class QuoteUnsupportedError extends BitcoinError {
  constructor(provider: string) {
    super("QUOTE_UNSUPPORTED", `${provider} has no FX desk — configure the Altradits provider for quotes`, 501, false);
    this.name = "QuoteUnsupportedError";
  }
}

export class ValidationError extends BitcoinError {
  constructor(message: string) {
    super("VALIDATION_ERROR", message, 400, false);
    this.name = "ValidationError";
  }
}
