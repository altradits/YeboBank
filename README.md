# YeboBank — Demo (test network)

> **Demo: test sats only, no real money.** This repository is a working
> demonstration on Bitcoin test networks (signet/regtest). It is not a bank,
> it holds no real deposits, pays no real interest, and connects to no real
> M-Pesa money. Interest, Mlinzi returns, and agent float shown in the demo
> are simulated. See [docs/DEMO_BOUNDARY.md](docs/DEMO_BOUNDARY.md).

[![Demo](https://img.shields.io/badge/Demo-yebobank.vercel.app-11A65B?style=for-the-badge&logo=vercel&logoColor=white)](https://yebobank.vercel.app)

**Demo:** [https://yebobank.vercel.app](https://yebobank.vercel.app)
(test sats only, no real money)

YeboBank is an open-source demo of a custodial Bitcoin savings concept for
Kenya: savers who already use M-Pesa could one day hold savings in Bitcoin.
This repo demonstrates the mechanics — accounts, a double-entry ledger,
savings locks, chamas, Lightning payments on test networks, and simulated
M-Pesa and investor-pool screens — without any real-money path.

YeboBank is a reference integration of the
[Altradits Developer API](/api/dev/v1 contract in docs/ALTRADITS_CONTRACT.md):
all Lightning operations go through that API (or a local fake implementing
the same contract) instead of talking to a node directly.

## Run the demo

```bash
cd frontend
cp .env.example .env.local   # optional; mock-data demo needs no secrets
npm install
npm run dev                  # http://localhost:3000
```

Every page works against mock data by default — no backend required.
Set `YEBO_BACKEND=on` in `.env.local` to use the built-in demo backend
(SQLite/JSON store, test sats only). Lightning uses the Altradits sandbox
(or the local fake) on signet/regtest; there is no mainnet switch.

Legacy static prototype: see [simple/](simple/) (2023, unused by the app).

## Frontend screens

### Core app

| Route | Screen |
|-------|-----------|
| `/dashboard` | Balance overview, savings + interest stats (simulated), recent activity |
| `/deposit` | Simulated M-Pesa STK Push and testnet Lightning invoice deposit tabs |
| `/withdraw` | Simulated M-Pesa B2C payout |
| `/send` | Testnet Lightning send + receive (your Lightning address) |
| `/history` | Full transaction ledger with credit/debit filters |
| `/settings` | Profile, language, security settings |

### Savings locks

| Route | Screen |
|-------|-----------|
| `/savings` | All your locks with growth chart (simulated) and timeframe selector. Contribute directly from a lock card. |
| `/savings/lock` | Create a new individual, group, or chama savings lock |
| `/savings/{id}` | Per-lock screen — principal + simulated interest stats, time-elapsed progress bar. **Single-member:** simple activity list. **Multi-member / group:** participants sidebar + shared chat panel (mirrors chama layout). |

### Chamas (group wallets)

| Route | Screen |
|-------|-----------|
| `/chama` | Your chamas — balance, contribution, member count |
| `/chama/create` | Create a new chama |
| `/chama/discover` | Browse and request to join public chamas |
| `/chama/portfolio` | Combined view of all your chama stakes — share %, personal value, gains, growth chart (simulated) |
| `/chama/{id}` | Full chama screen — stats, members sidebar, chat/activity feed, deposit, withdraw, vote, join-request management |

### Mlinzi — friends & family investor program (simulated)

| Route | Screen | Role |
|-------|-----------|------|
| `/invest` | Investor view — request access, see your simulated position + projected growth, FI calculator, withdrawal requests | Friends & family investor |
| `/mlinzi` | Fund steward overview — total simulated AUM, fees earned, pending access requests and withdrawals | Mlinzi (fund steward) |
| `/mlinzi/deploy` | Deploy simulated pool capital — shows pool received vs. already deployed vs. available; simulated M-Pesa or testnet Lightning tabs | Mlinzi |
| `/mlinzi/income` | Income sources — add / edit / remove simulated sources with yield tracking | Mlinzi |
| `/mlinzi/investors` | Investor positions — post simulated monthly statements, track compounding returns per investor | Mlinzi |
| `/mlinzi/access` | Access request queue — accept or decline friends & family requests, assign relationship type | Mlinzi |
| `/mlinzi/withdrawals` | Withdrawal queue — approve or decline investor withdrawal requests, set expected delivery date | Mlinzi |
| `/mlinzi/card` | Virtual card demo — auto-rotating CVV display only, no real card | Mlinzi |

### Agent (simulated float)

| Route | Screen |
|-------|-----------|
| `/agent` | Agent screen — cash-in / cash-out operations, simulated float tracking |

## What a real launch would need

This section is informational, not legal advice. Before YeboBank could hold
real customer funds or operate as described in the concept:

- **Deposit-taking licence** — taking savings and paying interest needs
  Central Bank of Kenya (CBK) licensing.
- **Collective investment scheme approval** — the Mlinzi investor pool needs
  Capital Markets Authority (CMA) authorisation.
- **Virtual asset (VASP) position** — holding customers' bitcoin raises
  virtual-asset service provider questions under Kenyan law (with counsel).
- **Data protection** — Office of the Data Protection Commissioner (ODPC)
  registration and compliance for customer data.

Until that work is complete, this repository stays a test-networks-only demo.
There is intentionally no mainnet switch, no real M-Pesa connection, and no
real-money path in the code.
