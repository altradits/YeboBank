# Altradits Developer API contract (reference integration)

YeboBank runs its Lightning operations through the Altradits Developer API
(`/api/dev/v1`) the same way any outside developer would — it never talks to
a node directly. Until the Altradits sandbox is deployed, the adapter runs
against the in-repo fake (`src/server/altradits-fake.ts`), which implements
this same contract. This file is the contract both sides follow.

> Status: no upstream `/api/dev/v1` spec exists yet in the developer
> worktree, so this contract is defined here. If upstream diverges, this
> file and the adapter move together.

## Auth

`Authorization: Bearer <ALTRADITS_API_KEY>` (sandbox/test keys only).
Configured by env: `ALTRADITS_API_BASE`, `ALTRADITS_API_KEY`,
`ALTRADITS_WEBHOOK_SECRET`. No secrets in the repo.

## Endpoints

### POST /invoices — create an invoice

```json
{ "amount_sats": 5000, "description": "…", "destination": "yebo-demo@signet.example" }
```

`destination` is YeboBank's registered destination Lightning address:
deposits settle to it. Response:

```json
{ "invoice": "lntbs…", "paymentHash": "…64 hex…", "amountSats": 5000, "expiresAt": "…" }
```

(field names are camelCase over the wire in this demo contract).

### GET /payments/{paymentHash} — status and verify

```json
{ "paymentHash": "…", "status": "pending|settled|failed|unknown", "amountSats": 5000, "settledAt": "…|null" }
```

YeboBank polls this after invoice creation as a safety net; the webhook is
the primary credit path.

### POST /payments — pay out

```json
{ "invoice_or_address": "lntbs…", "amount_sats": 5000 }
```

Response: `{ "paymentHash": "…", "status": "settled|failed" }`.

### GET /fee-balance — prepaid fee balance

```json
{ "fee_balance_sats": 999975 }
```

Fees are 0.5% (50 bps, minimum 1 sat) per settled payment, drawn from the
prepaid balance. The demo fake starts at 1,000,000 test sats.

## Webhooks (Altradits → YeboBank)

`POST /api/webhooks/altradits` on the YeboBank side.

Headers:

- `x-altradits-timestamp`: unix millis when signed
- `x-altradits-signature`: hex HMAC-SHA256 of
  `${timestamp}.${rawBody}` under `ALTRADITS_WEBHOOK_SECRET`

Body:

```json
{ "event": "invoice.settled", "paymentHash": "…", "amountSats": 5000 }
```

YeboBank verifies the signature (constant-time compare), rejects timestamps
outside a 5-minute replay window, drops unknown invoices and amount
mismatches, and credits the ledger idempotently by payment hash
(`ref = ln:<hash>` — replays return the original tx).

## Test networks only

Sandbox and fake operate on signet/regtest with valueless test sats. There
is no mainnet path. The fake optionally drives a local regtest LND for its
internals (see [LIGHTNING_REGTEST.md](LIGHTNING_REGTEST.md)) when
`LND_REGTEST_*` env is set; otherwise it is pure in-memory.
