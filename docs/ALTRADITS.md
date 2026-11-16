# Altradits API integration

[Altradits](https://altradits.com) ("Bitcoin in. M-Pesa out.") bridges Lightning
sats and M-Pesa shillings in Kenya. It is YeboBank's **default live rail**:
with one API key the bank creates Lightning invoices, pays invoices/addresses,
and prices KES ↔ sats — no node to operate.

## What it does for YeboBank

| Flow | Altradits role |
|------|---------------|
| Customer deposit (Lightning) | Issues the invoice the payer pays |
| Customer send / agent payout / pool deployment | Pays the destination invoice / address |
| KES ↔ sats pricing | FX desk (`/v1/quotes`) — LND has none, so quotes always resolve here |
| Settlement | Webhook → YeboBank credits the custodial ledger (see below) |

Fee model: the payout partner charges **1%** (visible on every quote as
`feePct`/`feeAmount`); the shop/user receives the quoted net amount.

## Configure

```bash
BITCOIN_PROVIDER=altradits        # the default — may be omitted
ALTRADITS_API_URL=https://api.altradits.com
ALTRADITS_API_KEY=<key from the Altradits dashboard>
ALTRADITS_WEBHOOK_SECRET=<secret for webhook HMAC verification>
```

Without `ALTRADITS_API_KEY` the provider runs in **sandbox mode**: same
interface, simulated settlement, clearly-fake data — the UI works end to end
and `/api/bitcoin/status` reports `mode: "sandbox"` so nobody mistakes it for
real money.

## Webhooks

Point the Altradits dashboard callback at:

```
POST {APP_BASE_URL}/api/bitcoin/webhook
```

Each request must carry `X-Altradits-Signature: <HMAC-SHA256 hex of raw body>`
computed with `ALTRADITS_WEBHOOK_SECRET`. Events:

```jsonc
{ "type": "invoice.settled", "invoice_id": "…", "payment_hash": "…" }
{ "type": "payment.settled", "payment_id": "…" }
{ "type": "payment.failed",  "payment_id": "…", "failure_reason": "…" }
```

On `invoice.settled` the bank must credit the custodial ledger (user id is in
the invoice metadata). That step is a recorded `TODO(ledger)` until the ledger
DB lands — settlements are logged and pollable via
`/api/bitcoin/invoices/[hash]` meanwhile.

## Endpoint contract used by the client

Altradits has not published a versioned REST spec, so
`frontend/src/server/bitcoin/altradits.ts` targets this conventional shape:

| Operation | Call |
|-----------|------|
| Health | `GET /v1/status` |
| Create invoice | `POST /v1/lightning/invoices` `{amount_sats, memo, expires_in, metadata}` |
| Lookup invoice | `GET /v1/lightning/invoices/{id}` |
| Decode invoice | `GET /v1/lightning/decode?invoice={bolt11}` |
| Pay | `POST /v1/lightning/payments` `{invoice \| lightning_address, amount_sats, memo?, fee_limit_sats?}` + `Idempotency-Key` |
| Lookup payment | `GET /v1/lightning/payments/{id}` |
| New address | `POST /v1/bitcoin/addresses` |
| Quote | `GET /v1/quotes?from=KES&to=SATS&amount=1000` |

Every field is mapped in exactly one place (the private `call` + response
interfaces at the top of `altradits.ts`). When the published spec differs,
adapting is a contained edit — the provider interface and all routes stay
unchanged.

## Verify

```bash
# sandbox (no key)
curl -s http://localhost:3000/api/bitcoin/status | jq .
curl -s 'http://localhost:3000/api/bitcoin/quote?from=KES&to=SATS&amount=1000' | jq .

# live (with key)
curl -s -X POST http://localhost:3000/api/deposit/lightning \
  -H 'Content-Type: application/json' -d '{"sats":1000}' | jq .
```
