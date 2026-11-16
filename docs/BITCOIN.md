# Bitcoin rail — architecture & operations

YeboBank moves real sats through a single provider interface. The UI never talks
to a node or a third-party API directly — it calls Next.js API routes, which
call the active `BitcoinProvider`.

```
UI (deposit / send / agent / mlinzi-deploy)
  → src/lib/api.ts            (BITCOIN_LIVE switch, per-function)
    → /api/* routes           (validation, rate limits, idempotency)
      → src/server/bitcoin    (BitcoinProvider interface)
        → LND node            (BITCOIN_PROVIDER=lnd)
        → Altradits API       (BITCOIN_PROVIDER=altradits, default)
        → in-memory mock      (BITCOIN_PROVIDER=mock)
```

## Switching providers

| Env | Effect |
|-----|--------|
| `BITCOIN_PROVIDER=altradits` (default) | Hosted rail. Live when `ALTRADITS_API_KEY` is set, transparent sandbox otherwise. No node to run. |
| `BITCOIN_PROVIDER=lnd` | Self-hosted LND via REST. Requires `LND_REST_URL` + `LND_MACAROON_HEX`. See [LND.md](LND.md). |
| `BITCOIN_PROVIDER=mock` | In-memory fake. Invoices contain `yebomock` and can never be paid on a real network. |

Frontend switch (independent of the rest of the mock backend):

| Env | Effect |
|-----|--------|
| `NEXT_PUBLIC_BITCOIN_LIVE=true` | Lightning functions in `api.ts` call the real `/api` routes. Everything else stays mocked. |
| `NEXT_PUBLIC_USE_MOCKS=false` | All of `api.ts` calls the backend (only bitcoin routes exist today — keep `true` until the full backend lands). |

Local dev with zero credentials:

```bash
cd frontend
cp .env.example .env.local   # defaults already select the Altradits sandbox
echo 'NEXT_PUBLIC_BITCOIN_LIVE=true' >> .env.local
npm run dev
```

Then `GET http://localhost:3000/api/bitcoin/status` should report
`provider: "altradits", mode: "sandbox"`.

## API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/deposit/lightning` | POST `{sats, memo?}` | Create deposit invoice → `{invoice, paymentHash, expiresAt}` |
| `/api/withdraw/lightning` | POST `{invoiceOrAddress, sats, memo?}` | Pay BOLT11 / Lightning address (idempotent) |
| `/api/agent/invoice` | POST `{amountSats}` | Agent counter invoice |
| `/api/agent/pay` | POST `{invoiceOrAddress, amountSats}` | Agent payout (idempotent) |
| `/api/agent/float/topup` | POST `{amountSats}` | Agent float top-up invoice |
| `/api/bitcoin/status` | GET | Provider + node health (no secrets) |
| `/api/bitcoin/quote?from&to&amount` | GET | KES/SATS/BTC quote with fee |
| `/api/bitcoin/onchain-address` | GET | Fresh deposit address |
| `/api/bitcoin/invoices/[hash]` | GET | Poll invoice status |
| `/api/bitcoin/webhook` | POST | Settlement callbacks (HMAC-verified) |
| `/.well-known/lnurlp/[username]` | GET | LNURL-pay metadata for `user@yebobank.com` |
| `/api/lnurlp/callback` | GET | LNURL-pay invoice step |

Money-moving routes are rate-limited per IP and accept `Idempotency-Key`.

## Money-safety rules (enforced in code)

1. Invoices are single-use; amounts are validated (10 sats – 0.1 BTC) before any provider call.
2. Payments refuse amount mismatch: a BOLT11 invoice for X sats is never paid with an approved amount ≠ X.
3. Expired invoices are never paid (LND path decodes first).
4. Webhooks are HMAC-verified; unsigned callbacks are rejected with 401.
5. Mock/sandbox data is visibly fake (`yebomock` invoices, `bcrt1qyebomock…` addresses) so it can never be mistaken for real money.

## What is still TODO before mainnet custody

- **Custodial ledger DB.** Webhook settlement currently logs instead of crediting — see the `TODO(ledger)` in `webhook/route.ts`. Needs a Postgres transaction keyed by `payment_hash`.
- **Durable store.** `src/server/bitcoin/store.ts` is in-memory; replace with Redis/Postgres for multi-instance prod.
- **User lookup for LNURL.** `lnurlp/[username]` resolves every well-formed name; bind it to the user DB.
- **Auth on routes.** Deposit/withdraw routes currently trust the session cookie only by presence; add the bank's session check before mainnet.
