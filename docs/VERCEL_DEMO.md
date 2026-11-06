# Vercel demo decision

**Decision: Vercel runs the mock-data demo.** The hosted demo at
yebobank.vercel.app keeps `YEBO_BACKEND` unset, so every screen renders from
mock data with the test-networks banner. No backend store, no LND, no
secrets, nothing to provision — the demo cannot touch real money because
there is no money path in that mode at all.

## Why not the backend on Vercel

- The demo backend is a JSON file store (`DATABASE_PATH`) designed for a
  single local process. Vercel's serverless filesystem is ephemeral and
  multi-instance: writes would vanish and diverge between invocations.
- Lightning needs the Altradits sandbox (not deployed yet) or a regtest
  LND, neither of which Vercel can reach.
- Sessions, CSRF secrets, and webhook secrets would need hosted secret
  management for zero demo benefit.

## What would be needed to host the backend

1. A small always-on host (VPS) running `next start` with a persistent
   `DATABASE_PATH`, or a swap of `src/server/store.ts` to SQLite/Postgres.
2. The Altradits sandbox URL + sandbox API key + webhook secret in env
   (`ALTRADITS_API_BASE/KEY/WEBHOOK_SECRET`), with the webhook URL pointed
   at the host.
3. `YEBO_BACKEND=on` + `NEXT_PUBLIC_YEBO_BACKEND=on` in env.

Until then: Vercel = mock demo with banner; backend + fake + regtest run
locally and in CI (`npm test`, `npm run test:e2e`).
