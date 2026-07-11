# YeboBank — Frontend

Open-source Bitcoin savings bank for Kenya. Save in sats, spend in shillings — top up via M-Pesa, earn yield, save with your chama, and cash out at a local agent.

## Quick start

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

All pages run against mock data — no backend or environment variables required.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Styling | Custom CSS design system (`globals.css`) + Tailwind CSS (utility layer, preflight disabled) |
| Components | shadcn/ui primitives (Badge, Tabs, Card, Avatar, Progress, Separator) |
| Icons | Tabler Icons webfont (`@tabler/icons-webfont` v3.7.0) |
| Fonts | Playfair Display (display) · Inter (body) · JetBrains Mono (data) |
| Design intelligence | UI/UX Pro Max skill (v2.6.2) |
| MCP | 21st.dev (`https://21st.dev/api/mcp`) — set `API_KEY_21ST` to activate |

---

## Route reference

### Public

| Route | Description |
|-------|-------------|
| `/` | Landing page — hero, feature sections, 4-role UserPaths, platform stats strip, converter |
| `/login` | Phone + PIN login |
| `/register` | New account registration |
| `/verify` | M-Pesa OTP verification |

### Customer (`/dashboard` and below)

| Route | Description |
|-------|-------------|
| `/dashboard` | Balance (ATM card), stats row (locked/interest/APY), notifications panel, recent activity |
| `/deposit` | M-Pesa STK Push + Lightning invoice |
| `/withdraw` | M-Pesa B2C payout |
| `/send` | Lightning send + receive (Lightning address) |
| `/history` | Full transaction ledger with credit/debit filters |
| `/settings` | Profile, language, security, notifications, privacy |

### Savings locks

| Route | Description |
|-------|-------------|
| `/savings` | All locks — growth chart, timeframe selector, contribute inline |
| `/savings/lock` | Create individual, group, or chama-linked lock |
| `/savings/{id}` | Per-lock dashboard — principal + interest, time-elapsed, activity, chat (multi-member) |

### Chamas (group wallets)

| Route | Description |
|-------|-------------|
| `/chama` | Your chamas — balance, contribution, member count |
| `/chama/create` | Create a new chama |
| `/chama/discover` | Browse and request to join public chamas |
| `/chama/portfolio` | Combined view — share %, personal value, gains, growth chart |
| `/chama/{id}` | Full chama — stats, members sidebar, chat, deposit, withdraw, vote, join-request management |

### Agent console

Requires `mockUser.isAgent === true`.

| Route | Description |
|-------|-------------|
| `/agent` | Float header (KES/Sats toggle + bento stats), customer lookup, cash-in/out, reserve management, transaction ledger, panic button |
| `/agent/settings` | Profile, till number, emergency contacts, commission rate (read-only), security |

### Investor portal

Requires `mockUser.accessStatus === "accepted"` (or Mlinzi role).

| Route | Description |
|-------|-------------|
| `/invest` | Position card (principal + current value + return %), monthly statements, FI Calculator, withdrawal request |
| `/invest/settings` | Profile, FI preferences, security, notifications |

### Mlinzi dashboard

Requires `mockUser.role === "mlinzi"`. Routes isolated via middleware — all other users are redirected.

| Route | Description |
|-------|-------------|
| `/mlinzi` | AUM overview cards (KES + sats, income sources, investors, fee), quick-action grid (6 tiles), my position, FI Calculator |
| `/mlinzi/deploy` | Deploy capital — pool availability progress bar, M-Pesa / Lightning / card tabs |
| `/mlinzi/investors` | Investor positions — post monthly statements, view per-investor history |
| `/mlinzi/access` | Access request queue — approve/decline, set relationship type (family/friend/self) |
| `/mlinzi/withdrawals` | Withdrawal queue — approve/decline, set expected delivery date |
| `/mlinzi/income` | Income sources — add/edit/remove real-estate, bonds, T-bills, funds with yield tracking |
| `/mlinzi/card` | Virtual card — auto-rotating CVV (default 15 min), per-transaction limit, deployment log |

---

## Role switching (mock data)

Edit `src/lib/mock.ts` and change `mockUser`:

```ts
// Customer (default)
role: "customer", isAgent: false, accessStatus: "none"

// Customer who is also an agent
role: "customer", isAgent: true

// Approved investor
role: "customer", accessStatus: "accepted"

// Mlinzi (fund steward)
role: "mlinzi"
```

---

## Design system

See `BRANDKIT.md` at the repo root — single source of truth for colors, typography, spacing, motion, and components (v6.0).

- **Palette**: Forest greens + gold. CSS tokens in `:root` in `globals.css`. Bitcoin Orange and Safari Green available as Tailwind utilities.
- **Dark/light**: toggled via `data-theme` on `<html>`; persisted to `localStorage`.
- **Tailwind**: installed with `preflight: false` so it coexists with the existing custom CSS. Use utility classes for shadcn component interiors; use BEM-style custom classes for everything else.

---

## Platform architecture (§14 of BRANDKIT.md)

Four isolated user groups, each with a purpose-built dashboard:

| Role | Entry point | Primary actions |
|------|-------------|----------------|
| **Customer** | Phone + M-Pesa OTP | Save, lock sats, chama, send via Lightning, withdraw to M-Pesa |
| **Agent** | Registration + float deposit | Cash in/out (0.5% commission), reserve management, panic system |
| **Investor** | Access request → Mlinzi approval | Monthly yield, FI Calculator, withdrawal request |
| **Mlinzi** | Pre-approved appointment | Deploy capital, manage investors, approve access/withdrawals, virtual card |

All money actions (deposit, withdraw, send, lock) are **modals** — no core action navigates away from the current dashboard.

---

## API layer

All API calls go through `src/lib/api.ts`. Every function currently returns mock data from `src/lib/mock.ts`. To connect a real backend: replace the mock implementations in `api.ts`. The rest of the frontend requires no changes.

---

## Design intelligence

The **UI/UX Pro Max skill** (v2.6.2) is installed at `~/.claude/skills/ui-ux-pro-max/`. It provides 84 UI styles, 161 color palettes, 73 font pairings, and 99 UX guidelines. Use it from Claude Code:

```
python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "banking dashboard" --domain style
python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "fintech mobile" --domain color
```

---

## Contributing

See `BRANDKIT.md` §13 (Governance). Design and code changes ship together in the same PR — update the brand kit and the implementation in a single change.
