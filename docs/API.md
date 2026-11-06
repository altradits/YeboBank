# YeboBank demo API

Base: `/api`. JSON everywhere. Cookies carry the session (`yebo_session`,
HttpOnly); state-changing requests must also send the per-session CSRF token
in the `X-CSRF-Token` header (value readable from the `yebo_csrf` cookie).

The frontend calls these through `src/lib/api.ts`, which uses mock data
unless `NEXT_PUBLIC_YEBO_BACKEND=on`. Error shape: `{ "error": "message" }`
with 400 (validation), 401 (not signed in / wrong PIN), 403 (bad CSRF),
409 (conflict), 423 (PIN locked), 429 (rate-limited).

## Auth

| Method & path | Body | Result |
|---|---|---|
| `POST /api/login` | `{ phone, pin }` | User + session cookies. Rate-limited (5/min per number). 6-digit PIN. |
| `POST /api/register` | `{ phone, fullName, pin }` | `{ otpSent: true }` + session cookies. Demo: the session starts here; `/verify` just confirms. |
| `POST /api/verify` | `{ code }` | Current user. Any 4+ character code in the demo. |
| `POST /api/logout` | — | Ends the session (CSRF required). |
| `GET /api/me` | — | Current user. |
| `GET /api/me/setup` | — | Per-role settings object. |
| `PATCH /api/me/setup` | `{ ...keys }` | Merged settings (CSRF required, allow-listed keys only). |

Demo accounts (seeded on first boot, PIN `284649` — documented because this
is a test-networks demo, do not reuse the pattern with real money):

| Phone | Persona |
|---|---|
| `+254700000001` | Mlinzi (Stanley) |
| `+254700000002` | Agent (Otieno) |
| `+254700000003` | Investor (Prudence) |
| `+254712345678` | Member (Wanjiku) |

PIN rules: 6 digits, no single repeated digit, no sequential run. Five wrong
tries lock the PIN for 15 minutes, then 1 hour, then 24 hours.

## Wallet & history

| Method & path | Result |
|---|---|
| `GET /api/wallet` | `{ balanceSats }`, derived from ledger legs. |
| `GET /api/history` | Ledger entries for the account, newest first, with running `balanceAfter`. |

## Money movement (PR3–PR4)

| Method & path | Body | Result |
|---|---|---|
| `POST /api/deposit/mpesa` | `{ kes }` | Simulated STK push; credits test sats. |
| `POST /api/withdraw/mpesa` | `{ sats }` | Simulated B2C payout; debits test sats. |
| `POST /api/deposit/lightning` | `{ sats }` | Invoice via the Altradits adapter (fake by default). |
| `GET /api/lightning/status?hash=` | — | Payment status by payment hash. |
| `POST /api/withdraw/lightning` | `{ invoiceOrAddress, sats }` | Testnet Lightning payment via the adapter. |
| `POST /api/webhooks/altradits` | signed webhook | HMAC-verified, idempotent ledger credit. |

## Savings, chamas, Mlinzi, agent (PR4)

These follow the `req()` paths already declared in `src/lib/api.ts`
(`/savings/...`, `/chama/...`, `/mlinzi/...`, `/invest/...`, `/agent/...`).
Simulated surfaces (Mlinzi returns, agent float, M-Pesa rail) are labelled
"simulated" in the UI and in `docs/MPESA_CONTRACT.md`.

## Rate limits

Login 5/min per number (+ 30/min per IP); register 10/min; reads 60/min;
writes 30/min per IP. Responses carry CSP and other security headers from
`middleware.ts`.
