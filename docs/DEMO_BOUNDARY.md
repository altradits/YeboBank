# Demo boundary

YeboBank is a **working demo on Bitcoin test networks only**. This document
defines the boundary. Anything that would cross it needs the licences and
legal work listed in the README first.

## What the demo does

- Real Bitcoin and Lightning mechanics on **signet or regtest** with test
  sats that have no value.
- A real backend (accounts, double-entry ledger, savings locks, chamas)
  running locally or in CI against test networks.
- Lightning operations through the Altradits Developer API sandbox (or a
  local fake implementing the same contract) — see
  [ALTRADITS_CONTRACT.md](ALTRADITS_CONTRACT.md).
- A fake M-Pesa rail with the same contract as STK push / B2C, clearly
  labelled simulated — see [MPESA_CONTRACT.md](MPESA_CONTRACT.md).

## What the demo never does

- No mainnet. There is no mainnet switch anywhere in the code, and none
  may be added without the licensing work below.
- No real M-Pesa money. STK push and B2C are simulated end to end.
- No real deposits, no real interest, no real investors. Interest, Mlinzi
  returns, and agent float are simulated and labelled "simulated" in the UI.
- No real-money path of any kind. Do not add one.

## Permanent UI requirements

- Every screen shows the banner: "Demo: test sats only, no real money".
  The banner is rendered by the root layout
  (`frontend/src/app/layout.tsx` via `DemoBanner`) and by the static
  prototype (`simple/index.html`). Removing it is out of scope.
- Every figure that is simulated (interest, Mlinzi returns, agent float,
  growth charts) carries a "simulated" label next to it.

## Copy rules (README, site, store listings)

- Never call it a live bank or say people can use it with real money.
- Never promise returns. APY and yield figures are illustrative demo values.
- Link back to this file when describing what the demo is.

## Records and secrets

- Records are never deleted (archive only).
- No secrets in the repo. Copy `frontend/.env.example` to `.env.local`
  and fill in local-only values. Test or placeholder contact details use
  phone `0707172370` and email `5tan@altradits.com` only.

## Test fiat rate

Mock conversions use a fixed illustrative rate (≈ 8.33 sats/KES in
`depositMpesa`) so the demo is deterministic. It is not a market rate.
