# Fake M-Pesa rail contract

STK push and B2C keep the same contract a real Daraja integration would
expose, but every step is simulated: no network calls, no real shillings,
test sats only. Implementation: `src/server/mpesa.ts`.

## Deposit (STK push)

Client: `POST /api/deposit/mpesa` with `{ kes }`.

- Validates `kes` (0 < kes ≤ 10,000,000).
- Converts at the fixed illustrative rate `SIM_SATS_PER_KES = 8.33`
  (deterministic for the demo; not a market rate).
- Posts a balanced ledger transaction
  `external:mpesa-fake → user:<id>` (`deposit_mpesa`).
- Returns `{ checkoutRequestId: "ws_CO_<ts>", satsCredited }` — the same
  shape the UI already renders.

A real integration would instead: create a pending checkout row, call
Daraja STK push, and credit only on the signed callback. The UI would not
change.

## Withdrawal (B2C)

Client: `POST /api/withdraw/mpesa` with `{ sats }`.

- Checks the test-sat balance first (402 when short).
- Posts `user:<id> → external:mpesa-fake` (`withdrawal_mpesa`).
- Returns `{ ok: true }`.

A real integration would queue a B2C payment and settle on callback.

## Labels

Every M-Pesa surface in the UI carries a "simulated" label, and ledger
notes say "Simulated M-Pesa …". There is intentionally no Daraja
credential, shortcode, or callback path in this repo.
