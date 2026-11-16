# Altradits provider (adapter)

YeboBank runs its Lightning operations through the Altradits Developer API
the same way any outside developer would. The wire contract is defined once,
in [ALTRADITS_CONTRACT.md](ALTRADITS_CONTRACT.md) — this file only describes
how the bitcoin rail plugs into it. If the contract moves, the port
(`frontend/src/server/altradits.ts`) moves with it; the adapter below it does
not need to change.

## Where each piece lives

| Piece | File |
|-------|------|
| Wire contract (endpoints, webhook signing, fees) | `docs/ALTRADITS_CONTRACT.md` |
| Port: sandbox HTTP client + fake/mode selection | `frontend/src/server/altradits.ts` |
| In-repo fake (+ optional regtest internals) | `frontend/src/server/altradits-fake.ts` |
| Shared types + webhook sign/verify | `frontend/src/lib/altradits.ts` |
| **Adapter: port → `BitcoinProvider`** | `frontend/src/server/bitcoin/altradits.ts` |
| Settlement path (verifies + credits ledger) | `frontend/src/app/api/webhooks/altradits/route.ts` |

## Mode selection (the port's rule)

- `ALTRADITS_MODE=fake` (default) or no `ALTRADITS_API_KEY` → in-repo fake.
  Sandbox: same interface, simulated settlement, `lntbs…` test invoices.
- A key plus any other `ALTRADITS_MODE` → live sandbox server at
  `ALTRADITS_API_BASE`.

`/api/bitcoin/status` reports which one is active (`mode: live|sandbox`) so
nobody mistakes fake money for real money.

## What the adapter adds over the port

The port speaks invoices, statuses, payments, and fee balance. The adapter
maps those onto the rail interface (`createInvoice`, `lookupInvoice`,
`payInvoice` with idempotency keys, `getNodeInfo`) so routes can switch
between Altradits, LND, and mock via `BITCOIN_PROVIDER` with no code changes.

Deliberate gaps (the contract is Lightning-only):

- **Quotes** (`/api/bitcoin/quote`) use the shared fixed-rate fallback at the
  contract's 0.5% fee until a live FX feed lands in the contract.
- **On-chain addresses** and **invoice decode** are unsupported on Altradits
  (`501`) — use `BITCOIN_PROVIDER=lnd` for those.

## Webhooks

Point the Altradits dashboard callback at:

```
POST {APP_BASE_URL}/api/webhooks/altradits
```

Signed per the contract (`x-altradits-timestamp` + `x-altradits-signature`
over `${timestamp}.${rawBody}`). The handler verifies (constant-time, 5-minute
replay window), drops unknown invoices and amount mismatches, and credits the
double-entry ledger idempotently by payment hash.

The separate `/api/bitcoin/webhook` is only for the bank's own LND invoice
poller (internal token, no Altradits signature) — see
[BITCOIN.md](BITCOIN.md).

## Verify

```bash
# sandbox fake (no key): invoice → lookup → signed webhook → wallet credit
BITCOIN_PROVIDER=altradits npm run bitcoin:smoke
```
