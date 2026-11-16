# LND node integration

YeboBank is LND-ready: setting `BITCOIN_PROVIDER=lnd` routes every invoice and
payment through your own Lightning node over the LND REST API. No code changes.

## 1. Provision a node

Any LND 0.17+ node with REST enabled works:

- **Managed (fastest):** Voltage, LNbits (LND backend), or Greenlight with a REST proxy.
- **Self-hosted:** `lnd` + `bitcoind` (or Neutrino for testnet), REST on `:8080`.

Fund it and open at least one well-capitalised channel before going live —
deposit invoices need **inbound** liquidity, payouts need **outbound**.

## 2. Bake a minimal macaroon

The bank needs the smallest possible permissions. On the node:

```bash
lncli bakemacaroon \
  uri:/lnrpc.Lightning/GetInfo \
  uri:/lnrpc.Lightning/AddInvoice \
  uri:/lnrpc.Lightning/LookupInvoice \
  uri:/lnrpc.Lightning/DecodePayReq \
  uri:/routerrpc.Router/SendPaymentV2 \
  uri:/lnrpc.Lightning/NewAddress \
  --save_to=yebo.readwrite.macaroon
xxd -p -c 1000 yebo.readwrite.macaroon | tr -d '\n'   # → LND_MACAROON_HEX
```

Never use the admin macaroon — a leak would give full wallet control.

## 3. Configure YeboBank

```bash
BITCOIN_PROVIDER=lnd
LND_REST_URL=https://lnd.internal:8080
LND_MACAROON_HEX=<hex from step 2>
```

TLS:

- **Production:** terminate TLS with a valid certificate (reverse proxy in front
  of LND). The provider refuses `LND_ALLOW_INSECURE_TLS=true` when
  `NODE_ENV=production`.
- **Dev only:** if the node uses a self-signed cert, set
  `LND_ALLOW_INSECURE_TLS=true` on your laptop. Never in staging/prod.

## 4. Verify

```bash
curl -s http://localhost:3000/api/bitcoin/status | jq .
# expect: provider "lnd", node.alias = your node, synced true

curl -s -X POST http://localhost:3000/api/deposit/lightning \
  -H 'Content-Type: application/json' -d '{"sats":1000}' | jq .invoice
# expect: a real lnbc... invoice — pay it from any wallet, then poll:
curl -s http://localhost:3000/api/bitcoin/invoices/<paymentHash> | jq .status
```

## 5. Liquidity & monitoring ops notes

- Track `synced`, `blockHeight`, and channel balances; alert when outbound
  liquidity drops below one day of payouts.
- LND pushes no webhooks — run the bank's invoice poller (or subscribe to
  `SubscribeSingleInvoice` from a worker) and POST settlements to
  `/api/bitcoin/webhook` with `X-Internal-Token: $WEBHOOK_INTERNAL_TOKEN`.
- Rotate the macaroon quarterly: bake a new one, update the secret, delete the old.

## Endpoint map (what the provider calls)

| Operation | LND REST call |
|-----------|---------------|
| `getNodeInfo` | `GET /v1/getinfo` |
| `createInvoice` | `POST /v1/invoices` |
| `lookupInvoice` | `GET /v1/invoice/{hash}` |
| `decodeInvoice` | `GET /v1/payreq/{bolt11}` |
| `payInvoice` | decode first, then `POST /v2/router/send` |
| `newOnchainAddress` | `GET /v1/new_address?type=0` (p2wpkh) |
| `getQuote` | unsupported by design — falls back to the Altradits FX desk |

Implementation: `frontend/src/server/bitcoin/lnd.ts`.
