# YeboBank demo database

Storage: a single JSON file (`DATABASE_PATH`, default `.data/yebo.json`)
with a serialised write queue — no external services. Shape versioned
(`version: 1`). Records are never deleted: every row has `archivedAt`
(null = live) and reads filter to live rows.

## Tables

### users

| Field | Notes |
|---|---|
| `id`, `phone` (+254…), `fullName`, `handle` (@…) | Identity. Phone unique. |
| `role` (customer/agent/mlinzi), `lightningAddress`, `language`, `isAgent` | Matches `User` in `src/types`. |
| `relationship`, `ffVerified`, `accessStatus` | Mlinzi friends & family gating. |
| `pinHash` | scrypt N=16384 (`scrypt$N$salt$key`, hex). |
| `pinStrikes`, `pinLockedUntil` | 5-strike escalating lockout (15m/1h/24h). |
| `createdAt`, `archivedAt` | Archive-only. |

### sessions

`tokenHash` (sha256 of the opaque cookie token), `userId`, `csrfToken`,
`createdAt`, `expiresAt` (24h), `archivedAt`.

### legs (double-entry ledger)

One row per leg; legs sharing `txId` are one transaction. `ref` is the
idempotency key (e.g. Lightning payment hash): reposting a `ref` returns
the original `txId` without writing.

| Field | Notes |
|---|---|
| `id`, `txId`, `account` | `account` is `user:<id>`, `chama:<id>`, `lock:<id>`, `pool`, `agent-float:<id>`, `agent-reserve:<id>`, `fees`, `external:mpesa-fake`, or `external:lightning`. |
| `debitSats`, `creditSats` | Non-negative safe integers. |
| `type`, `note` | Ledger type (`deposit_mpesa`, …) and human note. |
| `ref`, `createdAt`, `archivedAt` | Idempotency, stamp, archive-only. |

Invariants (enforced by `src/server/ledger.ts`, checked by `reconcile()`):

- Every transaction balances: sum(debits) == sum(credits), both > 0.
- Every balance is derived: `balanceOf(account)` = Σ(credit − debit).
- No account exceeds `MAX_MONEY_SATS` (2.1e15).

Example — 8330 test sats deposited via simulated M-Pesa for user `u_1`:

```json
[
  { "txId": "tx_…", "account": "external:mpesa-fake", "debitSats": 8330, "creditSats": 0 },
  { "txId": "tx_…", "account": "user:u_1", "debitSats": 0, "creditSats": 8330 }
]
```

### setups

`userId` → allow-listed settings patch (`mpesaNumber`, `tillNumber`, …),
`updatedAt`, `archivedAt`.

### docs.* (PR4 document tables)

`locks`, `lockMessages`, `invites`, `chamas`, `chamaMembers`,
`chamaMessages`, `chamaVotes`, `joinRequests`, `incomeSources`,
`positions`, `accessRequests`, `withdrawals`, `notifications`,
`deployments`, `cards`, `agentState`, `agentLedger`. Same `archivedAt`
convention; money moves only through `legs`.

### counters

`{ [prefix]: n }` for `nextId()` uniqueness.
