// Minimal in-memory record of invoices/payments created through this server.
// Purpose: idempotency keys, webhook correlation, and invoice-status polling
// in development. PRODUCTION MUST replace this with Postgres/Redis — a server
// restart currently loses pending-payment state.

import type { InvoiceStatusValue, PaymentStatusValue } from "./types";

export interface StoredInvoice {
  id: string;
  paymentHash: string;
  amountSats: number;
  memo?: string;
  status: InvoiceStatusValue;
  provider: string;
  createdAt: string;
  settledAt?: string;
  metadata?: Record<string, string>;
}

export interface StoredPayment {
  id: string;
  status: PaymentStatusValue;
  amountSats: number;
  destination: string;
  idempotencyKey?: string;
  createdAt: string;
  failureReason?: string;
}

const MAX_RECORDS = 5000;

class BitcoinStore {
  private invoices = new Map<string, StoredInvoice>();
  private payments = new Map<string, StoredPayment>();
  private paymentsByKey = new Map<string, string>(); // idempotencyKey -> payment id

  private prune(map: Map<string, unknown>): void {
    if (map.size <= MAX_RECORDS) return;
    const drop = map.size - MAX_RECORDS;
    const keys = map.keys();
    for (let i = 0; i < drop; i++) {
      const k = keys.next();
      if (k.done) break;
      map.delete(k.value);
    }
  }

  saveInvoice(inv: StoredInvoice): StoredInvoice {
    this.invoices.set(inv.id, inv);
    this.invoices.set(`hash:${inv.paymentHash}`, inv);
    this.prune(this.invoices);
    return inv;
  }

  getInvoice(idOrHash: string): StoredInvoice | undefined {
    return this.invoices.get(idOrHash) ?? this.invoices.get(`hash:${idOrHash}`);
  }

  setInvoiceStatus(idOrHash: string, status: InvoiceStatusValue, settledAt?: string): StoredInvoice | undefined {
    const inv = this.getInvoice(idOrHash);
    if (!inv) return undefined;
    inv.status = status;
    if (settledAt) inv.settledAt = settledAt;
    return inv;
  }

  findPaymentByKey(key: string): StoredPayment | undefined {
    const id = this.paymentsByKey.get(key);
    return id ? this.payments.get(id) : undefined;
  }

  savePayment(p: StoredPayment): StoredPayment {
    this.payments.set(p.id, p);
    if (p.idempotencyKey) this.paymentsByKey.set(p.idempotencyKey, p.id);
    this.prune(this.payments);
    return p;
  }

  getPayment(id: string): StoredPayment | undefined {
    return this.payments.get(id);
  }

  setPaymentStatus(id: string, status: PaymentStatusValue, failureReason?: string): StoredPayment | undefined {
    const p = this.payments.get(id);
    if (!p) return undefined;
    p.status = status;
    if (failureReason !== undefined) p.failureReason = failureReason;
    return p;
  }
}

// Singleton per server process (dev + single-instance prod).
const g = globalThis as unknown as { __yeboBitcoinStore?: BitcoinStore };

export function getStore(): BitcoinStore {
  if (!g.__yeboBitcoinStore) g.__yeboBitcoinStore = new BitcoinStore();
  return g.__yeboBitcoinStore;
}
