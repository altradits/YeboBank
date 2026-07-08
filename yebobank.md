# YeboBank — Complete Platform Redesign

## Overview

YeboBank is an **open‑source Bitcoin savings bank built for Kenya**. It solves the erosion of savings by inflation (6–9% annually) by converting shillings into Bitcoin (satoshis) and enabling yield generation through a transparent investment pool managed by a trusted **Mlinzi** (fund steward).

The platform serves four distinct user groups, each with purpose‑built dashboards, security controls, and workflows:

| User Group | Primary Goal | Entry Point |
|------------|--------------|-------------|
| **Customer** | Save, earn interest, transact via M‑Pesa/Lightning, and participate in chamas | Phone number + M‑Pesa verification |
| **Agent** | Serve customers without smartphones, earn commission on cash‑in/out | Agent registration + float deposit |
| **Investor** | Grow capital through the Mlinzi’s investment pool | Request access → approved by Mlinzi |
| **Mlinzi** | Deploy pool capital, manage investor positions, and earn management fees | Pre‑approved role; isolated console |

---

## 1. Customer (Individual Saver)

### Journey

1. **Sign up** with phone number → verify via M‑Pesa OTP.
2. **Dashboard** loads with balance, recent activity, and quick actions.
3. **Deposit** via M‑Pesa (STK Push) or Lightning invoice.
4. **Lock savings** to earn ~5.2% APY from real yield (fee: 2% of yield, only if positive).
5. **Join or create a chama** to save with a group.
6. **Send money** instantly via Lightning to any wallet.
7. **Withdraw** to M‑Pesa at any time.

### Dashboard: `/dashboard`

- **Balance card** – shows total available in KES/sats with toggle.
- **Stats row** – locked savings, interest earned, target APY.
- **Quick actions** – Deposit, Withdraw, Send, Lock Savings, Chamas.
- **Recent activity** – last 5 transactions with “View all” link to `/history`.
- **Notifications** – chama votes, join requests, deposit confirmations.

### Savings: `/savings`

- **Overview stats** – total locked, interest accrued, APY.
- **List of locks** – each shows principal, accrued interest, maturity date.
- **Create new lock** – individual, group (invite by handle), or chama‑linked.
- **Growth chart** – principal vs. value over time (switchable timeframe).
- **Lock detail** (`/savings/{id}`) – activity feed, participants (for group/chama), contribution button.

### Chama: `/chama`

- **Portfolio card** – number of active chamas, pending items, total contributions.
- **List of my chamas** – each card shows group balance, your share, gain/loss.
- **Actions** – New Chama, Discover, My Total (portfolio), Add Money.
- **Chama detail** (`/chama/{id}`):
  - **Header** – name, member count, group balance.
  - **Members sidebar** – list with balances and roles (admin/member).
  - **Activity feed** – deposits, withdrawals, votes, join requests (system messages).
  - **Chat** – real‑time discussion (supports text, votes, join‑request messages).
  - **Actions** – Contribute, Withdraw, Send to member, Invite/Share, New Vote, Statement (CSV download).
  - **Voting** – create polls with options; threshold: >75% of members.
  - **Join requests** – pending requests require approvals; auto‑approve when threshold met.

### Agent Access (`/agent`)

- **Only visible** to users with `isAgent: true`.
- **Dashboard** – working float, reserve, commission earned, M‑Pesa till number.
- **Customer lookup** – search by phone; shows name and membership status.
- **Cash in/out** – enter amount; system converts at live rate; commission (0.5%) credited to agent.
- **Assisted service** – deposit/withdraw/send on behalf of verified customers (access‑code required).
- **Reserve management** – move excess to time‑locked reserve (requires PIN + 15‑min delay).
- **Panic system** – multi‑level emergency contacts; reactivation requires codes from contacts.

### History: `/history`

Full ledger with filters (type, date range, direction).

### Settings: `/settings` (Customer)

- **Profile** – name, phone, email (optional), Lightning address.
- **Security** – change password, change transaction PIN.
- **Notifications** – email/SMS preferences (deposits, withdrawals, chama activity).
- **Language** – English / Kiswahili.
- **Privacy** – manage visibility (e.g., hide phone from public chama members).

---

## 2. Agent

### Journey

1. **Register as agent** – provide business details, deposit working float.
2. **Dashboard** shows float, commission, and recent transactions.
3. **Serve customers** – look up phone, verify identity, perform cash in/out.
4. **Manage float** – top up via Lightning invoice; move excess to reserve.
5. **Earn commissions** – automatically credited per transaction.

### Dashboard: `/agent`

- **Float & commission** – working float, reserve, total earned, rate.
- **Customer service panel** – phone input + lookup result (name, member status).
- **Action buttons** – Cash in, Cash out, Assisted services (deposit/withdraw/send).
- **Reserve controls** – release reserve (PIN + time delay), move to reserve.
- **Panic button** – triggers emergency contact alerts.
- **Recent transaction list** – all agent‑facilitated operations.

### Settings: `/agent/settings`

- **Profile** – location, M‑Pesa till number, business hours.
- **Commission rate** (read‑only, set by bank).
- **Emergency contacts** – add/remove contacts with priority tiers (personal, legal, life‑death).
- **Security** – change password, change PIN.
- **Notifications** – alert preferences for low float, panic events.

---

## 3. Investor

### Journey

1. **Request access** via `/invest` – provides relationship info.
2. **Mlinzi reviews** and approves/declines in `/mlinzi/access`.
3. **Once approved**, investor sees their position and can deposit.
4. **Monthly statements** are posted by Mlinzi; investor can view history.
5. **Request withdrawal** – Mlinzi must approve; capital may be illiquid.

### Dashboard: `/invest`

- **Position card** – principal (in sats and KES at entry), current value, total return.
- **Monthly statements** – list with opening/closing balances, return, fee deducted.
- **FI Calculator** – user sets annual expenses, FI rate, assumed return; shows target, coverage, years to FI.
- **Actions** – Request withdrawal (submits to Mlinzi for approval).
- **Notifications** – statement posted, withdrawal status updates.

### Settings: `/invest/settings`

- **Profile** – same as customer (name, phone, email).
- **FI preferences** – default annual expenses, FI rule, assumed return (saved per user).
- **Security** – change password, change PIN.
- **Notifications** – statement alerts, withdrawal updates.

---

## 4. Mlinzi (Fund Steward)

> **Security:** All Mlinzi routes are **isolated** and only accessible to users with `role: "mlinzi"`. The console is referred to as **Mlinzi Dashboard** (not “console”) in the UI.

### Journey

1. **Dashboard overview** – total AUM, investors, fee earned, own position.
2. **Deploy capital** – move pool funds via M‑Pesa, Lightning, or Virtual Card.
3. **Manage investors** – add new positions, post monthly statements, view each investor’s history.
4. **Approve access requests** – accept/decline with relationship type.
5. **Approve withdrawals** – review and set expected delivery date.
6. **Track income sources** – record real‑estate, bonds, funds, etc., with return rates.
7. **Use Virtual Card** – one‑time CVV card for deploying to platforms that only accept cards; CVV rotates automatically.

### Dashboard: `/mlinzi` (Mlinzi Dashboard)

- **Pool overview cards** – AUM (KES & sats), income sources, investors, fee earned this cycle.
- **My position** (Mlinzi’s own investment) – principal, current value, monthly statements.
- **FI Calculator** (personal) – same as investor version, for Mlinzi’s own planning.
- **Quick actions** – Deploy, Investors, Access, Withdrawals, Income, Card.
- **Recent activity** – latest deployments, statement postings, approved withdrawals.

### Deploy Capital: `/mlinzi/deploy`

- **Pool availability** – total received, already deployed, available to deploy (with progress bar).
- **Deployment method** – tabs: M‑Pesa, Lightning, Card.
- **Form** – amount (KES), recipient (phone for M‑Pesa, address for Lightning), optional notes.
- **Deployment log** – list of past deployments with amounts, methods, dates.

### Investors: `/mlinzi/investors`

- **Summary** – total AUM, fee earned, statements posted, average position.
- **List of investors** – each shows name, handle, relationship, principal, current value, number of statements.
- **Actions per investor** – “Post statement” (opens modal to enter return KES for the month), “View” (go to detail).
- **Add investor** – manually create a position (handle, relationship, principal).

### Access Requests: `/mlinzi/access`

- **Pending list** – requester name, handle, requested at.
- **Action** – select relationship type (family/friend/self) then Accept or Decline.
- **History** – previously handled requests (accepted/declined).

### Withdrawals: `/mlinzi/withdrawals`

- **Queue stats** – pending, approved, delivered counts.
- **Pending list** – each shows requester, amount, requested date.
- **Approve** – set expected delivery date, add optional note → moves to approved.
- **Decline** – optional note; investor is notified.
- **Approved list** – shows delivery dates.

### Income Sources: `/mlinzi/income`

- **List** – each source: name, type, principal KES, annual return %, compounding flag, liquidity status, notes.
- **Actions** – Add, Edit, Remove.
- **Used to calculate** – expected pool returns and provide transparency to investors.

### Virtual Card: `/mlinzi/card`

- **Card display** – number (partially hidden), cardholder, expiry, CVV (reveal on demand).
- **Status** – active/inactive, CVV rotation period (default 15 min).
- **Stats** – total deployed, per‑transaction limit.
- **Actions** – generate new card, rotate CVV now, update limit, delete card.
- **Info** – explains auto‑rotating CVV prevents subscriptions/auto‑renewals.

### Settings: `/mlinzi/settings`

- **Profile** – same as customer (name, phone, email).
- **Security** – change password, change PIN (separate from investor PIN).
- **Notifications** – alerts for new access requests, withdrawal requests, deployment confirmations.
- **Preferences** – default FI assumptions (for calculator).

---

## Additional Features & Improvements

### Investment Model (Transparent & Fair)

- **Pool composition** – all investor capital is custodied 1:1 in sats.
- **Yield generation** – Mlinzi deploys capital into income‑producing assets (real estate, bonds, funds).
- **Profit distribution** – monthly: returns calculated, 2% management fee deducted, remainder distributed pro‑rata to investors based on their share of the pool.
- **Statements** – append‑only; each month’s statement shows opening, return, fee, closing.
- **Withdrawals** – subject to Mlinzi approval; may be delayed if capital is illiquid.

### Security Enhancements

- **Role‑based access** – routes protected; middleware checks `role` and `accessStatus`.
- **Transaction PIN** – required for withdrawals, sending, and sensitive actions (separate from login password).
- **Append‑only ledger** – every transaction is recorded immutably; nothing can be deleted or silently edited.
- **Mlinzi isolation** – Mlinzi routes are completely hidden from non‑Mlinzi users; even if guessed, middleware redirects.
- **Reserve time‑lock** – agent reserve requires PIN + 15‑minute delay (60s in mock) to prevent immediate robbery.
- **Panic system** – multi‑tier contacts; reactivation requires codes from all required contacts.

### Settings per User Group (Detailed)

| User Group | Settings Available |
|------------|---------------------|
| **Customer** | Profile (name, phone, email, Lightning address), Security (password, PIN), Notifications (email/SMS for deposits, chama activity), Language, Privacy (hide phone in chama) |
| **Agent** | Profile (location, till number), Security (password, PIN), Emergency contacts (add/remove with tier), Notifications (float alerts, panic events), Commission rate (read‑only) |
| **Investor** | Profile (same as customer), FI preferences (annual expenses, FI rule, assumed return), Security (password, PIN), Notifications (statement alerts, withdrawal updates) |
| **Mlinzi** | Profile (same as customer), Security (password, PIN – separate from investor PIN), Notifications (access/withdrawal requests, deployment confirmations), FI assumptions (for calculator) |

### Additional UX Improvements

- **Dashboard quick actions** – all core actions (deposit, withdraw, send, lock) are modals, keeping users on the same page.
- **Chama chat** – real‑time activity feed with system messages for votes, joins, deposits.
- **Growth charts** – interactive (timeframe selector: daily/weekly/monthly/quarters/years).
- **Multi‑currency display** – toggle between KES, sats, BTC, USD on any balance.
- **Lightning address** – each user gets a personal address (`handle@yebobank.com`) for receiving payments.
- **Agent‑assisted service** – allows customers without smartphones to transact securely via agent (with OTP/offline code verification).

---

## Summary of Routes by User

| Route | Customer | Agent | Investor | Mlinzi |
|-------|----------|-------|----------|--------|
| `/` (landing) | ✅ | ✅ | ✅ | ✅ |
| `/login` / `/register` | ✅ | ✅ | ✅ | ✅ |
| `/dashboard` | ✅ | ✅ | ✅ | ✅ |
| `/savings` | ✅ | ✅ | ✅ | ✅ |
| `/savings/lock` | ✅ | ✅ | ✅ | ✅ |
| `/savings/{id}` | ✅ | ✅ | ✅ | ✅ |
| `/chama` | ✅ | ✅ | ✅ | ✅ |
| `/chama/create` | ✅ | ✅ | ✅ | ✅ |
| `/chama/discover` | ✅ | ✅ | ✅ | ✅ |
| `/chama/portfolio` | ✅ | ✅ | ✅ | ✅ |
| `/chama/{id}` | ✅ | ✅ | ✅ | ✅ |
| `/agent` | ❌ | ✅ | ❌ | ❌ |
| `/agent/settings` | ❌ | ✅ | ❌ | ❌ |
| `/invest` | ✅ (if approved) | ✅ (if approved) | ✅ | ✅ |
| `/invest/settings` | ✅ (if approved) | ✅ (if approved) | ✅ | ✅ |
| `/mlinzi` | ❌ | ❌ | ❌ | ✅ |
| `/mlinzi/*` | ❌ | ❌ | ❌ | ✅ |
| `/history` | ✅ | ✅ | ✅ | ✅ |
| `/settings` | ✅ | ✅ | ✅ | ✅ |

---

## Conclusion

This redesigned platform ensures every user has a clear, purpose‑driven dashboard, appropriate security, and a smooth journey from onboarding to advanced financial activities. The Mlinzi role is fully isolated and secure, and all investment mechanics are transparent and fair.