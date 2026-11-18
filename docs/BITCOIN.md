# Bitcoin rail — architecture & operations

YeboBank moves test sats through a single provider interface. The UI never talks
to a node or a third-party API directly — it calls Next.js API routes, which
call the active `BitcoinProvider`, which settles against the double-entry
ledger in `frontend/src/server/ledger.ts`.

```
UI (deposit / send / agent / mlinzi-deploy)
  → src/lib/api.ts            (YEBO_BACKEND / BITCOIN_LIVE switches)
    → /api/* routes           (session auth + CSRF + throttle, per-route)
      → src/server/bitcoin    (BitcoinProvider interface)
        → LND node            (BITCOIN_PROVIDER=lnd)
        → Altradits port      (BITCOIN_PROVIDER=altradits, default)
        → in-memory mock      (BITCOIN_PROVIDER=mock)
      → src/server/ledger.ts  (double-entry credits, idempotent by hash)
```

## Networks: test sats only in demo

The demo backend is test-networks-only by policy — see
[DEMO_BOUNDARY.md](DEMO_BOUNDARY.md). The Altradits fake issues `lntbs…`
signet-shaped invoices, and the mock rail issues `yebomock`-marked data, so
neither can ever be mistaken for real money. The LND provider is
network-agnostic (it talks to whatever node `LND_REST_URL` points at, including
the local regtest in `docker/regtest/`); pointing it at mainnet is an explicit
operator decision requiring its own security review, never the demo default.

## Switching providers

| Env | Effect |
|-----|--------|
| `BITCOIN_PROVIDER=altradits` (default) | Canonical port (`src/server/altradits.ts`). Live sandbox when `ALTRADITS_API_KEY` is set plus non-`fake` `ALTRADITS_MODE`; transparent fake otherwise. No node to run. |
| `BITCOIN_PROVIDER=lnd` | Self-hosted LND via REST. Requires `LND_REST_URL` + `LND_MACAROON_HEX`. See [LND.md](LND.md). |
| `BITCOIN_PROVIDER=mock` | In-memory fake implementing the full interface (quotes, on-chain, decode). Offline dev harness. |

Frontend switches:

| Env | Effect |
|-----|--------|
| `NEXT_PUBLIC_YEBO_BACKEND=on` | All of `api.ts` uses the built-in demo backend where routes exist. |
| `NEXT_PUBLIC_BITCOIN_LIVE=true` | Lightning functions call the real `/api` routes while everything else stays mocked. |

Local dev with zero credentials:

```bash
cd frontend
cp .env.example .env.local   # defaults select the Altradits fake
echo 'NEXT_PUBLIC_BITCOIN_LIVE=true' >> .env.local
npm run dev
```

Then `GET http://localhost:3000/api/bitcoin/status` should report
`provider: "altradits", mode: "sandbox"`.

## API routes

Money-moving routes require a session + CSRF token and are throttled per IP;
payments accept `Idempotency-Key`. Errors from backend-integrated routes use
`{ error: string }`; standalone bitcoin utility routes use
`{ error: { code, message } }` (TODO: unify on the coded shape).

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/deposit/lightning` | POST `{sats, memo?}` | yes | Create invoice, track per-user → `{invoice, paymentHash}` |
| `/api/withdraw/lightning` | POST `{invoiceOrAddress, sats, memo?}` | yes | Balance-checked pay → `{ok, paymentId}` |
| `/api/agent/invoice` | POST `{amountSats}` | yes | Agent counter invoice |
| `/api/agent/pay` | POST `{invoiceOrAddress, amountSats}` | yes | Agent payout |
| `/api/agent/float/topup` | POST `{amountSats}` | yes | Agent float top-up invoice |
| `/api/lightning/status?hash=` | GET | yes | Invoice status; credits on settle |
| `/api/webhooks/altradits` | POST | HMAC | Canonical settlement path → ledger credit |
| `/api/bitcoin/webhook` | POST | internal token | Bank's own LND poller callbacks → ledger credit |
| `/api/bitcoin/status` | GET | no | Provider + rail health (no secrets) |
| `/api/bitcoin/quote?from&to&amount` | GET | no | KES/SATS/BTC quote with fee |
| `/api/bitcoin/onchain-address` | GET | no | Fresh deposit address (LND/mock only) |
| `/api/bitcoin/invoices/[hash]` | GET | no | Poll invoice status (hash-guarded) |
| `/.well-known/lnurlp/[username]` | GET | no | LNURL-pay metadata for `user@yebobank.com` |
| `/api/lnurlp/callback` | GET | no | LNURL-pay invoice step |

## Money-safety rules (enforced in code)

1. Invoices are single-use; amounts are validated (10 sats – 0.1 BTC) before any provider call.
2. Withdrawals check the ledger balance first; insufficient funds → `402`, no payment attempted.
3. Payments refuse amount mismatch on rails that decode (LND decodes first; unknown/expired invoices are never paid).
4. Webhooks are HMAC-verified with a replay window; unsigned callbacks are rejected; unknown invoices and amount mismatches credit nothing.
5. Ledger credits are idempotent by payment hash (`ref = ln:<hash>`) — webhook replays return the original tx.
6. Fake data is visibly fake (`lntbs…yebofake`, `yebomock`, `bcrt1…`) so it can never be mistaken for real money.

## What is still TODO before real custody

- **Durable store.** `src/server/store.ts` is a JSON file (single-instance demo); replace with Postgres for multi-instance prod.
- **Error-shape unification** (see above) and per-route audit logging.
- **Chama action PIN for other rails.** `requirePin` currently gates chama
  transfer/withdraw; Lightning/agent payouts rely on session + CSRF only.
