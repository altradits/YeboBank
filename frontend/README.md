# YeboBank — Frontend

The complete frontend for **YeboBank**, an open-source Bitcoin savings bank for
Kenya. This is a Next.js (App Router) + TypeScript app. Every page renders and
every link works against **mock data** so you can build the Go backend behind a
single, well-defined seam.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

Build for production:

```bash
npm run build && npm start
```

> Node 18.18+ or 20+ recommended.

## What's included

**Public**
- `/` — full marketing landing page (live ticker, hero, inflation, savings,
  M-Pesa, chamas, agents, Lightning, trust, live converter, CTA, footer)
- `/login`, `/register`, `/verify` — auth flow (navigates straight to the app)

**Authenticated app** (route group `(app)` with sidebar + mobile bottom nav)
- `/dashboard` — balance, savings + interest stats, recent activity
- `/deposit` — M-Pesa STK Push + Lightning invoice tabs
- `/withdraw` — M-Pesa B2C payout
- `/send` — Lightning send + receive (your Lightning address)
- `/savings` and `/savings/lock` — locks, progress, new lock
- `/history` — full ledger with in/out filters
- `/chama` and `/chama/create` — group wallets
- `/agent` — agent dashboard (cash in / cash out)
- `/settings` — profile, security, logout

Every amount is in **satoshis** and converts to KES / BTC / USD using one live
exchange rate shared across the whole UI.

## Live exchange rate

`src/lib/rate-context.tsx` provides a React context with the current rate. It
fetches BTC/USD + BTC/KES from CoinGecko every 60s and gently random-walks
between fetches so tickers always feel alive. If the request is blocked it falls
back to a simulated feed automatically.

**For production:** point `fetchPrice()` at your own `/api/rate` endpoint
(backed by the `rate_snapshots` table) instead of calling CoinGecko from the
browser — you already cache the rate server-side every 60s.

## Wiring the backend (the one file that matters)

All data access goes through **`src/lib/api.ts`**. Right now each function
returns mock data after a short delay. To go live:

1. Set `USE_MOCKS = false` at the top of `src/lib/api.ts`.
2. Implement the matching Go routes (see `docs/API.md` in the main repo). The
   `req()` helper already sends cookies and JSON; each function notes its route.
3. Keep the function signatures and return types identical — the UI keeps
   working unchanged.

Types live in `src/types/index.ts` and mirror the database schema, so the Go
handlers can serialize straight into them.

## Project structure

```
src/
  app/
    layout.tsx            fonts (next/font), Tabler icons, RateProvider
    globals.css           full design system (tokens, landing, app shell, UI)
    page.tsx              landing page
    login|register|verify auth pages
    (app)/
      layout.tsx          app shell (sidebar + bottom nav + top bar)
      dashboard|deposit|withdraw|send|savings|savings/lock|
      history|chama|chama/create|agent|settings
  components/
    landing/              Ticker, SiteNav, Hero, FeatureSections, Highlights,
                          Converter, Footer
    app/                  Nav (sidebar + bottom nav), TopBar, BalanceCard,
                          TransactionRow
    ui/                   Button (material ripple), useReveal hook
  lib/
    api.ts                ← backend seam (mock now, fetch later)
    rate-context.tsx      live rate provider + useRate()
    format.ts             money + time formatters
    mock.ts               placeholder data
  types/index.ts          domain types
```

## Design notes

- **Palette** leans into wealth (gold), hope/growth (emerald), and authority
  (deep forest), with a terracotta spark. This intentionally goes more vibrant
  than the spec's muted brand tokens, per the design brief.
- **Fonts:** Space Grotesk (display), IBM Plex Sans (body), JetBrains Mono
  (all numbers/codes), loaded via `next/font`.
- **Motion:** material ripple on buttons, scroll-reveal, count-ups, ticker
  flashes. All of it respects `prefers-reduced-motion`.
- **Responsive:** sidebar collapses to a mobile bottom nav under 900px.

## Notes / TODO for production

- Auth is cosmetic until the backend exists — `login`/`register`/`verify` just
  navigate forward. Add real session handling + route protection (middleware
  redirecting unauthenticated users to `/login`).
- Agent locations and names on the landing map are placeholder content.
- Add a transaction-PIN prompt before debits (withdraw, send, lock, contribute)
  per `docs/SECURITY.md`.
