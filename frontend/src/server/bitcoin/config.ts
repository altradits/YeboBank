// Central configuration for the bitcoin layer. All secrets come from env vars
// and are NEVER exposed to the browser (no NEXT_PUBLIC_ reads here).

import type { BitcoinProviderName } from "./types";

export interface LndConfig {
  restUrl: string;
  macaroonHex: string;
  /** Dev-only escape hatch for self-signed node certs. Never true in production. */
  allowInsecureTls: boolean;
  timeoutMs: number;
}

export interface AltraditsConfig {
  baseUrl: string;
  apiKey: string | null;
  webhookSecret: string | null;
  feePct: number;
  timeoutMs: number;
}

export interface BitcoinConfig {
  provider: BitcoinProviderName;
  lnd: LndConfig;
  altradits: AltraditsConfig;
  /** Public base URL of this app — used for LNURL callbacks. */
  appBaseUrl: string;
  lightningDomain: string;
}

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

export function getBitcoinConfig(): BitcoinConfig {
  const rawProvider = (env("BITCOIN_PROVIDER") ?? "altradits").toLowerCase();
  const provider: BitcoinProviderName =
    rawProvider === "lnd" || rawProvider === "altradits" || rawProvider === "mock" ? rawProvider : "altradits";

  const lndMacaroon = env("LND_MACAROON_HEX") ?? env("LND_MACAROON") ?? "";
  return {
    provider,
    lnd: {
      restUrl: (env("LND_REST_URL") ?? "https://127.0.0.1:8080").replace(/\/$/, ""),
      macaroonHex: lndMacaroon.replace(/\s+/g, ""),
      allowInsecureTls: env("LND_ALLOW_INSECURE_TLS") === "true",
      timeoutMs: Number(env("LND_TIMEOUT_MS") ?? 15000),
    },
    altradits: {
      baseUrl: (env("ALTRADITS_API_URL") ?? "https://api.altradits.com").replace(/\/$/, ""),
      apiKey: env("ALTRADITS_API_KEY") ?? null,
      webhookSecret: env("ALTRADITS_WEBHOOK_SECRET") ?? null,
      feePct: Number(env("ALTRADITS_FEE_PCT") ?? 1),
      timeoutMs: Number(env("ALTRADITS_TIMEOUT_MS") ?? 15000),
    },
    appBaseUrl: (env("APP_BASE_URL") ?? env("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000").replace(/\/$/, ""),
    lightningDomain: env("LIGHTNING_DOMAIN") ?? "yebobank.com",
  };
}

export function isLndConfigured(cfg: BitcoinConfig = getBitcoinConfig()): boolean {
  return Boolean(cfg.lnd.restUrl && cfg.lnd.macaroonHex);
}

export function isAltraditsConfigured(cfg: BitcoinConfig = getBitcoinConfig()): boolean {
  return Boolean(cfg.altradits.apiKey);
}

/** Safe subset for the /api/bitcoin/status endpoint — never includes secrets. */
export function publicProviderStatus(cfg: BitcoinConfig = getBitcoinConfig()): {
  provider: BitcoinProviderName;
  lndConfigured: boolean;
  altraditsConfigured: boolean;
  lightningDomain: string;
} {
  return {
    provider: cfg.provider,
    lndConfigured: isLndConfigured(cfg),
    altraditsConfigured: isAltraditsConfigured(cfg),
    lightningDomain: cfg.lightningDomain,
  };
}
