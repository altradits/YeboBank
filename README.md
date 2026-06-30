# YeboBank

YeboBank is a custodial Bitcoin bank, not a wallet or exchange. It targets low-income earners in Kenya who already use M-Pesa and want a savings account that earns interest in Bitcoin.

## Frontend dashboards

Run the frontend (`cd frontend && npm install && npm run dev`) then navigate to any of the routes below. All pages work against mock data — no backend required.

### Core app

| Route | Dashboard |
|-------|-----------|
| `/dashboard` | Balance overview, savings + interest stats, recent activity |
| `/deposit` | M-Pesa STK Push and Lightning invoice deposit tabs |
| `/withdraw` | M-Pesa B2C payout |
| `/send` | Lightning send + receive (your Lightning address) |
| `/history` | Full transaction ledger with credit/debit filters |
| `/settings` | Profile, language, security settings |

### Savings locks

| Route | Dashboard |
|-------|-----------|
| `/savings` | All your locks with growth chart and timeframe selector (Daily / Weekly / Monthly / Q1–Q3 / 1Y–10Y). Contribute directly from a lock card. |
| `/savings/lock` | Create a new individual, group, or chama savings lock |
| `/savings/{id}` | Per-lock dashboard — principal + interest stats, time-elapsed progress bar. **Single-member:** simple activity list. **Multi-member / group:** participants sidebar + shared chat panel (mirrors chama layout). Redirected here with `?justDeposited=1` after a contribution to highlight the new deposit. |

### Chamas (group wallets)

| Route | Dashboard |
|-------|-----------|
| `/chama` | Your chamas — balance, contribution, member count |
| `/chama/create` | Create a new chama |
| `/chama/discover` | Browse and request to join public chamas |
| `/chama/portfolio` | Combined view of all your chama stakes — share %, personal value, gains, growth chart |
| `/chama/{id}` | Full chama dashboard — stats, members sidebar, chat/activity feed, deposit, withdraw, vote, join-request management |

### Mlinzi — friends & family investor program

| Route | Dashboard | Role |
|-------|-----------|------|
| `/invest` | Investor view — request access, see your position + projected growth, FI calculator, withdrawal requests | Friends & family investor |
| `/steward` | Fund steward overview — total AUM, fees earned, pending access requests and withdrawals | Mlinzi (fund steward) |
| `/steward/deploy` | Deploy pool capital — shows pool received vs. already deployed vs. available; M-Pesa or Lightning tabs to move funds out; success state links directly to adding an income source with the amount pre-filled | Mlinzi |
| `/steward/income` | Income sources — add / edit / remove real-estate, bonds, T-bills, funds, and other sources with yield tracking; accepts `?prefilledKes=` from the deploy flow | Mlinzi |
| `/steward/investors` | Investor positions — post monthly statements, track compounding returns per investor | Mlinzi |
| `/steward/access` | Access request queue — accept or decline friends & family requests, assign relationship type | Mlinzi |
| `/steward/withdrawals` | Withdrawal queue — approve or decline investor withdrawal requests, set expected delivery date | Mlinzi |

### Agent

| Route | Dashboard |
|-------|-----------|
| `/agent` | Agent dashboard — cash-in / cash-out operations, float tracking |
