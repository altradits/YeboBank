// Provider router — the single entry point API routes use.
//
//   BITCOIN_PROVIDER=lnd        → self-hosted LND node (see docs/LND.md)
//   BITCOIN_PROVIDER=altradits  → Altradits hosted rail (default, see docs/ALTRADITS.md)
//   BITCOIN_PROVIDER=mock       → in-memory fake (tests, offline dev)
//
// Default is Altradits because it works with zero node operations: without an
// API key it runs in transparent sandbox mode, and the moment ALTRADITS_API_KEY
// is set the same code path moves real sats. Flip to `lnd` when the node is
// provisioned — no code changes needed.

import type { BitcoinProvider, Quote, QuoteParams } from "./types";
import { QuoteUnsupportedError } from "./types";
import { getBitcoinConfig } from "./config";
import { LndProvider } from "./lnd";
import { AltraditsProvider } from "./altradits";
import { MockProvider } from "./mock";

const g = globalThis as unknown as { __yeboBitcoinProvider?: BitcoinProvider };

export function getBitcoinProvider(): BitcoinProvider {
  if (!g.__yeboBitcoinProvider) {
    const cfg = getBitcoinConfig();
    g.__yeboBitcoinProvider =
      cfg.provider === "lnd" ? new LndProvider(cfg.lnd)
      : cfg.provider === "mock" ? new MockProvider()
      : new AltraditsProvider(cfg.altradits);
  }
  return g.__yeboBitcoinProvider;
}

/** Test/dev escape hatch — resets the cached provider after env changes. */
export function resetBitcoinProvider(): void {
  g.__yeboBitcoinProvider = undefined;
}

/**
 * Quotes always resolve through the FX desk. LND is a node, not an FX desk,
 * so when the active provider is LND (or anything without quotes), this
 * falls back to Altradits — live when ALTRADITS_API_KEY is set, fixed-rate
 * sandbox otherwise. The returned quote names its real source.
 */
export async function getQuoteWithFallback(params: QuoteParams): Promise<Quote> {
  const primary = getBitcoinProvider();
  try {
    return await primary.getQuote(params);
  } catch (err) {
    if (!(err instanceof QuoteUnsupportedError)) throw err;
    const cfg = getBitcoinConfig();
    const fx = new AltraditsProvider(cfg.altradits);
    const quote = await fx.getQuote(params);
    return { ...quote, source: `${quote.source} (fx-fallback, provider=${primary.name})` };
  }
}
