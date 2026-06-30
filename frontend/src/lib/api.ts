// =============================================================================
// API LAYER — THE ONE FILE TO CHANGE WHEN YOU BUILD THE BACKEND
// =============================================================================
// Every screen calls these functions and nothing else. Right now they resolve
// mock data after a short delay so the UI behaves like a real async app.
//
// To go live: replace each body with a fetch() to your Go server. The route
// table already exists in docs/API.md. Suggested mapping is noted per function.
// Keep the function signatures and return types identical and the UI keeps working.
// =============================================================================

import type {
  User, Wallet, LedgerEntry, SavingsLock, Chama, Agent,
  ChamaMessage, ChamaVote, JoinRequest,
  MyChamaStake, ChamaGrowthPoint, ChamaPortfolio, SavingsGrowthPoint, SavingsDeposit,
  IncomeSource, InvestorPosition, FIProfile, WithdrawalRequest, AppNotification, AccessRequest,
  PendingInvite, LockMessage, PoolDeployment,
} from "@/types";
import {
  mockUser, mockWallet, mockLedger, mockLocks, mockChamas, mockAgent, mockAgentLedger, mockCustomerDirectory,
  mockAllChamas, mockChamaMessages, mockChamaVotes, mockJoinRequests,
  mockGrowthData, mockSavingsGrowth, mockSavingsDeposits, mockPendingInvites,
  mockIncomeSources, mockInvestorPositions, mockAccessRequests, mockFIProfiles,
  mockWithdrawalRequests, mockNotifications,
  mockLockMessages, mockPoolDeployments,
} from "@/lib/mock";

const USE_MOCKS = true; // flip to false once the backend endpoints exist

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// Helper for the real implementation later. Cookies carry the session.
async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

// ---- auth --------------------------------------------------------------------
export async function login(phone: string, password: string): Promise<User> {
  if (USE_MOCKS) return delay(mockUser);
  return req<User>("/login", { method: "POST", body: JSON.stringify({ phone, password }) });
}

export async function register(phone: string, fullName: string): Promise<{ otpSent: boolean }> {
  if (USE_MOCKS) return delay({ otpSent: true });
  return req("/register", { method: "POST", body: JSON.stringify({ phone, fullName }) });
}

export async function verifyOtp(code: string): Promise<User> {
  if (USE_MOCKS) return delay(mockUser);
  return req<User>("/verify", { method: "POST", body: JSON.stringify({ code }) });
}

export async function logout(): Promise<void> {
  if (USE_MOCKS) return delay(undefined);
  await req("/logout", { method: "POST" });
}

// ---- account -----------------------------------------------------------------
export async function getUser(): Promise<User> {
  if (USE_MOCKS) return delay(mockUser);
  return req<User>("/me");
}

export async function getWallet(): Promise<Wallet> {
  if (USE_MOCKS) return delay(mockWallet);
  return req<Wallet>("/wallet");
}

export async function getHistory(): Promise<LedgerEntry[]> {
  if (USE_MOCKS) return delay(mockLedger);
  return req<LedgerEntry[]>("/history");
}

// ---- deposit / withdraw ------------------------------------------------------
export async function depositMpesa(kes: number): Promise<{ checkoutRequestId: string }> {
  if (USE_MOCKS) return delay({ checkoutRequestId: "ws_CO_demo" });
  return req("/deposit/mpesa", { method: "POST", body: JSON.stringify({ kes }) });
}

export async function withdrawMpesa(sats: number): Promise<{ ok: boolean }> {
  if (USE_MOCKS) return delay({ ok: true });
  return req("/withdraw/mpesa", { method: "POST", body: JSON.stringify({ sats }) });
}

export async function depositLightning(sats: number): Promise<{ invoice: string }> {
  if (USE_MOCKS) {
    return delay({ invoice: "lnbc" + sats + "n1pdemoinvoiceonlyplaceholdervalue" });
  }
  return req("/deposit/lightning", { method: "POST", body: JSON.stringify({ sats }) });
}

export async function sendLightning(invoiceOrAddress: string, sats: number): Promise<{ ok: boolean }> {
  if (USE_MOCKS) return delay({ ok: true });
  return req("/withdraw/lightning", { method: "POST", body: JSON.stringify({ invoiceOrAddress, sats }) });
}

// ---- savings -----------------------------------------------------------------
export async function getLocks(): Promise<SavingsLock[]> {
  if (USE_MOCKS) return delay(mockLocks);
  return req<SavingsLock[]>("/savings");
}

// TODO(backend): GET /savings/growth — from interest_distributions + savings_locks accrual
export async function getSavingsGrowth(): Promise<SavingsGrowthPoint[]> {
  if (USE_MOCKS) return delay([...mockSavingsGrowth]);
  return req<SavingsGrowthPoint[]>("/savings/growth");
}

// TODO(backend): GET /savings/deposits — from ledger_entries where type='deposit_*'
export async function getSavingsDeposits(): Promise<SavingsDeposit[]> {
  if (USE_MOCKS) return delay([...mockSavingsDeposits]);
  return req<SavingsDeposit[]>("/savings/deposits");
}

export async function createLock(sats: number, years: number): Promise<SavingsLock> {
  if (USE_MOCKS) {
    return delay({
      id: "s_new", principalSats: sats, accruedSats: 0, lockYears: years,
      status: "active", lockedAt: new Date().toISOString(),
      maturesAt: new Date(Date.now() + years * 365 * 86400e3).toISOString(),
    });
  }
  return req<SavingsLock>("/savings/lock", { method: "POST", body: JSON.stringify({ sats, years }) });
}

// TODO(backend): GET /savings/{id}
export async function getLock(id: string): Promise<SavingsLock> {
  if (USE_MOCKS) {
    const lock = mockLocks.find((l) => l.id === id);
    if (!lock) throw new Error(`Lock ${id} not found`);
    return delay({ ...lock, participants: lock.participants?.map((p) => ({ ...p })) });
  }
  return req<SavingsLock>(`/savings/${id}`);
}

// TODO(backend): POST /savings/{lockId}/contribute — verify membership + deduct wallet
export async function addToLock(lockId: string, sats: number): Promise<SavingsLock> {
  if (USE_MOCKS) {
    const lock = mockLocks.find((l) => l.id === lockId);
    if (!lock) throw new Error(`Lock ${lockId} not found`);
    lock.principalSats += sats;
    const mine = lock.participants?.find((p) => p.handle === MOCK_HANDLE);
    if (mine) {
      mine.contributedSats += sats;
    } else if (lock.participants) {
      lock.participants.push({ handle: MOCK_HANDLE, name: MOCK_NAME, contributedSats: sats });
    }
    return delay({ ...lock, participants: lock.participants?.map((p) => ({ ...p })) });
  }
  return req<SavingsLock>(`/savings/${lockId}/contribute`, { method: "POST", body: JSON.stringify({ sats }) });
}

// TODO(backend): POST /savings/lock/group — creates shared lock, pushes invites to handles
export async function createGroupLock(sats: number, years: number, title: string, handles: string[]): Promise<SavingsLock> {
  if (USE_MOCKS) {
    const newLock: SavingsLock = {
      id: `s_g_${Date.now()}`, principalSats: sats, accruedSats: 0, lockYears: years,
      status: "active", lockedAt: new Date().toISOString(),
      maturesAt: new Date(Date.now() + years * 365 * 86400e3).toISOString(),
      kind: "group", title,
      participants: [
        { handle: MOCK_HANDLE, name: MOCK_NAME, contributedSats: sats },
        ...handles.map((h) => ({ handle: h, name: h, contributedSats: 0 })),
      ],
    };
    mockLocks.push(newLock);
    return delay({ ...newLock });
  }
  return req<SavingsLock>("/savings/lock/group", { method: "POST", body: JSON.stringify({ sats, years, title, handles }) });
}

// TODO(backend): POST /savings/lock/chama — creates chama-shared lock tied to chamaId
export async function createChamaLock(chamaId: string, sats: number, years: number): Promise<SavingsLock> {
  if (USE_MOCKS) {
    const chama = mockAllChamas.find((c) => c.id === chamaId);
    const newLock: SavingsLock = {
      id: `s_c_${Date.now()}`, principalSats: sats, accruedSats: 0, lockYears: years,
      status: "active", lockedAt: new Date().toISOString(),
      maturesAt: new Date(Date.now() + years * 365 * 86400e3).toISOString(),
      kind: "chama", title: chama?.name ?? "Chama lock", chamaId,
      participants: [{ handle: MOCK_HANDLE, name: MOCK_NAME, contributedSats: sats }],
    };
    mockLocks.push(newLock);
    return delay({ ...newLock });
  }
  return req<SavingsLock>("/savings/lock/chama", { method: "POST", body: JSON.stringify({ chamaId, sats, years }) });
}

// TODO(backend): GET /savings/invites — pending lock invites for current user
export async function getMyPendingInvites(): Promise<PendingInvite[]> {
  if (USE_MOCKS) return delay([...mockPendingInvites]);
  return req<PendingInvite[]>("/savings/invites");
}

// TODO(backend): POST /savings/invites/{id}/accept — accept a lock invite, join the target
export async function acceptInvite(inviteId: string): Promise<void> {
  if (USE_MOCKS) {
    const idx = mockPendingInvites.findIndex((i) => i.id === inviteId);
    if (idx !== -1) {
      const invite = mockPendingInvites[idx]!;
      const chama = mockAllChamas.find((c) => c.id === invite.targetId);
      if (chama) { chama.isMember = true; chama.memberCount += 1; }
      mockPendingInvites.splice(idx, 1);
    }
    return delay(undefined);
  }
  await req(`/savings/invites/${inviteId}/accept`, { method: "POST" });
}

// ---- chamas ------------------------------------------------------------------
export async function getChamas(): Promise<Chama[]> {
  if (USE_MOCKS) return delay(mockChamas);
  return req<Chama[]>("/chama");
}

export async function createChama(name: string, contributionSats: number): Promise<Chama> {
  if (USE_MOCKS) {
    return delay({
      id: "c_new", name, description: "", balanceSats: 0,
      contributionSats, memberCount: 1, maxMembers: 50,
    });
  }
  return req<Chama>("/chama/create", { method: "POST", body: JSON.stringify({ name, contributionSats }) });
}

// ---- agent -------------------------------------------------------------------
export async function getAgent(): Promise<Agent> {
  if (USE_MOCKS) return delay(mockAgent);
  return req<Agent>("/agent");
}

export async function agentCashTransact(
  direction: "in" | "out", phone: string, amountSats: number,
): Promise<{ agent: Agent; entry: LedgerEntry }> {
  if (USE_MOCKS) {
    const commission = Math.round(amountSats * mockAgent.commissionRate);
    mockAgent.totalEarnedSats += commission;
    if (direction === "in") mockAgent.floatLimitSats -= amountSats;
    else mockAgent.floatLimitSats += amountSats;
    const entry: LedgerEntry = {
      id: `l_agent_${Date.now()}`,
      type: direction === "in" ? "agent_cash_in" : "agent_cash_out",
      direction: direction === "in" ? "credit" : "debit",
      amountSats: commission,
      balanceAfter: mockAgent.totalEarnedSats,
      note: `${direction === "in" ? "Cash in" : "Cash out"} for ${phone} · commission`,
      createdAt: new Date().toISOString(),
      status: "confirmed",
    };
    mockAgentLedger.unshift(entry);
    return delay({ agent: mockAgent, entry });
  }
  return req("/agent/cash", { method: "POST", body: JSON.stringify({ direction, phone, amountSats }) });
}

export async function getAgentHistory(): Promise<LedgerEntry[]> {
  if (USE_MOCKS) return delay(mockAgentLedger);
  return req<LedgerEntry[]>("/agent/history");
}

// Looks up whoever is in front of the agent's counter — member or not.
// Anyone with or without a YeboBank wallet can be served; only members go
// through the access-verification step below.
// TODO(backend): GET /agent/customer/{phone}
export async function lookupAgentCustomer(
  phone: string,
): Promise<{ phone: string; name: string | null; isMember: boolean }> {
  if (USE_MOCKS) {
    const found = mockCustomerDirectory.find((c) => c.phone === phone);
    return delay(found ? { ...found } : { phone, name: null, isMember: false });
  }
  return req(`/agent/customer/${encodeURIComponent(phone)}`);
}

export type AccessChannel = "sms" | "email" | "offline";

// TODO(backend): POST /agent/access/request — sends real OTP for sms/email
export async function requestAgentAccessCode(phone: string, channel: AccessChannel): Promise<{ sent: boolean }> {
  if (USE_MOCKS) return delay({ sent: true });
  return req("/agent/access/request", { method: "POST", body: JSON.stringify({ phone, channel }) });
}

// TODO(backend): POST /agent/access/verify — real OTP/offline-code check
export async function verifyAgentAccessCode(phone: string, code: string): Promise<{ verified: boolean }> {
  if (USE_MOCKS) return delay({ verified: code.trim().length >= 4 });
  return req("/agent/access/verify", { method: "POST", body: JSON.stringify({ phone, code }) });
}

export type AgentServiceKind = "savings_deposit" | "chama_contribution" | "withdrawal_request" | "lightning_send";

const AGENT_SERVICE_LABELS: Record<AgentServiceKind, string> = {
  savings_deposit:     "Savings deposit",
  chama_contribution:  "Chama contribution",
  withdrawal_request:  "Withdrawal request",
  lightning_send:      "Lightning send",
};

// Lets a verified, in-person customer use any YeboBank service through the
// agent without needing their own device.
// TODO(backend): POST /agent/service — route to matching service endpoint
// (savings/{lockId}/contribute, chama/{id}/deposit, invest/withdraw, etc.)
// after re-checking the access verification server-side.
export async function agentAssistService(
  phone: string, kind: AgentServiceKind, amountSats: number, note?: string,
): Promise<{ ok: boolean; entry: LedgerEntry }> {
  if (USE_MOCKS) {
    const entry: LedgerEntry = {
      id: `l_agentsvc_${Date.now()}`,
      type: "agent_service_assist",
      direction: "credit",
      amountSats,
      balanceAfter: mockAgent.totalEarnedSats,
      note: `${AGENT_SERVICE_LABELS[kind]} for ${phone} via agent${note ? ` · ${note}` : ""}`,
      createdAt: new Date().toISOString(),
      status: "confirmed",
    };
    mockAgentLedger.unshift(entry);
    return delay({ ok: true, entry });
  }
  return req("/agent/service", { method: "POST", body: JSON.stringify({ phone, kind, amountSats, note }) });
}

// ── Agent-side Lightning facilitation ────────────────────────────────────────
// TODO(backend): POST /agent/invoice → lnd.AddInvoice({ value: amountSats }), return payment_request
export async function agentGenerateInvoice(amountSats: number): Promise<{ invoice: string }> {
  if (USE_MOCKS) {
    return delay({ invoice: `lnbc${amountSats}n1p` + Math.random().toString(36).slice(2, 12) + "agentinvoice" });
  }
  return req("/agent/invoice", { method: "POST", body: JSON.stringify({ amountSats }) });
}

// TODO(backend): POST /agent/pay → lnd.SendPaymentV2({ payment_request | dest })
export async function agentPayInvoice(invoiceOrAddress: string, amountSats: number): Promise<{ ok: boolean }> {
  if (USE_MOCKS) return delay({ ok: true });
  return req("/agent/pay", { method: "POST", body: JSON.stringify({ invoiceOrAddress, amountSats }) });
}

// ── Chama feature (new endpoints) ────────────────────────────────────────────
// Current user handle used by mock layer only. Backend derives from session.
const MOCK_HANDLE = "@wanjiku";
const MOCK_NAME   = "Wanjiku Kamau";

// Returns all YeboBank chamas with isMember/pendingJoin flags.
// TODO(backend): GET /chama/all
export async function getAllChamas(): Promise<Chama[]> {
  if (USE_MOCKS) return delay([...mockAllChamas]);
  return req<Chama[]>("/chama/all");
}

// Returns a single chama including full member list.
// TODO(backend): GET /chama/{id}
export async function getChama(id: string): Promise<Chama> {
  if (USE_MOCKS) {
    const chama = mockAllChamas.find((c) => c.id === id);
    if (!chama) throw new Error(`Chama ${id} not found`);
    return delay({ ...chama });
  }
  return req<Chama>(`/chama/${id}`);
}

// TODO(backend): GET /chama/{id}/messages
export async function getChamaMessages(id: string): Promise<ChamaMessage[]> {
  if (USE_MOCKS) return delay([...(mockChamaMessages[id] ?? [])]);
  return req<ChamaMessage[]>(`/chama/${id}/messages`);
}

// Posts a plain-text message. Command parsing happens in the UI; each command
// calls the appropriate action endpoint then calls this to record the message.
// TODO(backend): POST /chama/{id}/messages
export async function postChamaMessage(id: string, msg: Omit<ChamaMessage, "id" | "chamaId" | "createdAt">): Promise<ChamaMessage> {
  if (USE_MOCKS) {
    const newMsg: ChamaMessage = {
      ...msg, id: `cm_${Date.now()}`, chamaId: id, createdAt: new Date().toISOString(),
    };
    if (!mockChamaMessages[id]) mockChamaMessages[id] = [];
    mockChamaMessages[id].push(newMsg);
    return delay(newMsg);
  }
  return req<ChamaMessage>(`/chama/${id}/messages`, { method: "POST", body: JSON.stringify(msg) });
}

// TODO(backend): GET /chama/{id}/votes
export async function getChamaVotes(id: string): Promise<ChamaVote[]> {
  if (USE_MOCKS) return delay([...(mockChamaVotes[id] ?? [])]);
  return req<ChamaVote[]>(`/chama/${id}/votes`);
}

// TODO(backend): GET /chama/{id}/join
export async function getChamaJoinRequests(id: string): Promise<JoinRequest[]> {
  if (USE_MOCKS) return delay(mockJoinRequests.filter((r) => r.chamaId === id));
  return req<JoinRequest[]>(`/chama/${id}/join`);
}

// TODO(backend): POST /chama/{id}/join
export async function requestJoinChama(id: string): Promise<JoinRequest> {
  if (USE_MOCKS) {
    const existing = mockJoinRequests.find((r) => r.chamaId === id && r.requesterHandle === MOCK_HANDLE);
    if (existing) return delay(existing);
    const req_: JoinRequest = {
      id: `jr_${Date.now()}`, chamaId: id,
      requesterHandle: MOCK_HANDLE, requesterName: MOCK_NAME,
      approvals: [], status: "pending",
    };
    mockJoinRequests.push(req_);
    // Also post a join_request message into the chama chat
    if (!mockChamaMessages[id]) mockChamaMessages[id] = [];
    mockChamaMessages[id].push({
      id: `cm_${Date.now()}`, chamaId: id, kind: "join_request",
      authorHandle: "@system", authorName: "System",
      body: `${MOCK_NAME} (${MOCK_HANDLE}) has requested to join the chama.`,
      createdAt: new Date().toISOString(), meta: { requestId: req_.id },
    });
    // Mark the chama as pendingJoin for the current user
    const chama = mockAllChamas.find((c) => c.id === id);
    if (chama) chama.pendingJoin = true;
    return delay(req_);
  }
  return req<JoinRequest>(`/chama/${id}/join`, { method: "POST" });
}

// Approve or reject a join request. Threshold: approvals > 75% of member count.
// TODO(backend): POST /chama/{chamaId}/join/{requestId}/vote  realtime: push approved member
export async function voteOnJoin(chamaId: string, requestId: string, approve: boolean): Promise<JoinRequest> {
  if (USE_MOCKS) {
    const jr = mockJoinRequests.find((r) => r.id === requestId && r.chamaId === chamaId);
    if (!jr) throw new Error("Join request not found");
    if (approve && !jr.approvals.includes(MOCK_HANDLE)) {
      jr.approvals.push(MOCK_HANDLE);
    }
    const chama = mockAllChamas.find((c) => c.id === chamaId);
    const memberCount = chama?.memberCount ?? 1;
    const needed = memberCount * 0.75;
    if (jr.approvals.length > needed) {
      jr.status = "approved";
      // Add member and post system message
      if (chama) {
        chama.memberCount += 1;
        if (!mockChamaMessages[chamaId]) mockChamaMessages[chamaId] = [];
        mockChamaMessages[chamaId].push({
          id: `cm_${Date.now()}`, chamaId, kind: "system",
          authorHandle: "@system", authorName: "System",
          body: `${jr.requesterName} (${jr.requesterHandle}) has been approved and joined the chama! 🎉`,
          createdAt: new Date().toISOString(),
        });
      }
    } else if (!approve) {
      jr.status = "rejected";
    }
    return delay({ ...jr });
  }
  return req<JoinRequest>(`/chama/${chamaId}/join/${requestId}/vote`, {
    method: "POST", body: JSON.stringify({ approve }),
  });
}

// TODO(backend): POST /chama/{id}/votes
export async function createChamaVote(id: string, question: string, options: string[]): Promise<ChamaVote> {
  if (USE_MOCKS) {
    const tallies: Record<string, string[]> = {};
    options.forEach((o) => { tallies[o] = []; });
    const vote: ChamaVote = {
      id: `v_${Date.now()}`, chamaId: id, question, options, tallies,
      status: "open", createdAt: new Date().toISOString(),
    };
    if (!mockChamaVotes[id]) mockChamaVotes[id] = [];
    mockChamaVotes[id].push(vote);
    return delay(vote);
  }
  return req<ChamaVote>(`/chama/${id}/votes`, { method: "POST", body: JSON.stringify({ question, options }) });
}

// Cast a vote on an option. Resolves instantly if threshold crossed or impossible.
// Threshold: an option passes when its votes > 75% of member count.
// TODO(backend): POST /chama/{chamaId}/votes/{voteId}/cast  realtime: push updated tallies
export async function castVote(chamaId: string, voteId: string, option: string): Promise<ChamaVote> {
  if (USE_MOCKS) {
    const votes = mockChamaVotes[chamaId] ?? [];
    const vote = votes.find((v) => v.id === voteId);
    if (!vote) throw new Error("Vote not found");
    if (vote.status !== "open") return delay({ ...vote });
    // Remove previous vote by this user from all options
    for (const opt of vote.options) {
      vote.tallies[opt] = (vote.tallies[opt] ?? []).filter((h) => h !== MOCK_HANDLE);
    }
    if (!vote.tallies[option]) vote.tallies[option] = [];
    vote.tallies[option].push(MOCK_HANDLE);

    const chama = mockAllChamas.find((c) => c.id === chamaId);
    const memberCount = chama?.memberCount ?? 1;
    const threshold = memberCount * 0.75;
    const allVoters = new Set(Object.values(vote.tallies).flat());
    const remaining = memberCount - allVoters.size;

    let concluded: "passed" | "failed" | null = null;
    for (const opt of vote.options) {
      if ((vote.tallies[opt]?.length ?? 0) > threshold) {
        concluded = "passed";
        vote.status = "passed";
        vote.closedAt = new Date().toISOString();
        break;
      }
    }
    if (!concluded) {
      const canAnyPass = vote.options.some(
        (opt) => (vote.tallies[opt]?.length ?? 0) + remaining > threshold,
      );
      if (!canAnyPass) {
        concluded = "failed";
        vote.status = "failed";
        vote.closedAt = new Date().toISOString();
      }
    }
    if (concluded && mockChamaMessages[chamaId]) {
      const winnerOpt = vote.options.find(
        (opt) => (vote.tallies[opt]?.length ?? 0) > threshold,
      );
      const outcome = concluded === "passed"
        ? `Vote passed: "${winnerOpt}" won on "${vote.question}".`
        : `Vote closed with no majority on "${vote.question}".`;
      mockChamaMessages[chamaId].push({
        id: `cm_${Date.now()}`, chamaId, kind: "system",
        authorHandle: "@system", authorName: "System",
        body: outcome, createdAt: new Date().toISOString(),
      });
    }
    return delay({ ...vote });
  }
  return req<ChamaVote>(`/chama/${chamaId}/votes/${voteId}/cast`, {
    method: "POST", body: JSON.stringify({ option }),
  });
}

// Deducts from member's personal wallet, adds to chama pool, posts deposit message.
// TODO(backend): POST /chama/{id}/deposit
export async function chamaDeposit(id: string, sats: number): Promise<{ ok: boolean }> {
  if (USE_MOCKS) {
    const chama = mockAllChamas.find((c) => c.id === id);
    if (chama) chama.balanceSats += sats;
    mockWallet.balanceSats = Math.max(0, mockWallet.balanceSats - sats);
    return delay({ ok: true });
  }
  return req<{ ok: boolean }>(`/chama/${id}/deposit`, { method: "POST", body: JSON.stringify({ sats }) });
}

// Transfers sats from current member's chama balance to another member's chama balance.
// Requires PIN verification (enforced by UI before calling; backend must re-verify).
// TODO(backend): POST /chama/{id}/transfer  PIN verification on server side
export async function chamaTransfer(id: string, toHandle: string, sats: number): Promise<{ ok: boolean }> {
  if (USE_MOCKS) return delay({ ok: true });
  return req<{ ok: boolean }>(`/chama/${id}/transfer`, {
    method: "POST", body: JSON.stringify({ toHandle, sats }),
  });
}

// ── Stake & portfolio ────────────────────────────────────────────────────────

// Returns my proportional stake summary for a single chama, derived from pool data.
// TODO(backend): GET /chama/{id}/stake — server computes from ledger snapshots
export async function getMyStake(chamaId: string): Promise<MyChamaStake> {
  if (USE_MOCKS) {
    const chama = mockAllChamas.find((c) => c.id === chamaId) ?? mockChamas.find((c) => c.id === chamaId);
    const myC = chama?.myContributionSats ?? 0;
    const poolC = chama?.poolContributionsSats ?? 0;
    const poolV = chama?.poolValueSats ?? chama?.balanceSats ?? 0;
    const mySharePct = poolC > 0 ? (myC / poolC) * 100 : 0;
    const poolGain = poolV - poolC;
    const myGainSats = Math.round((mySharePct / 100) * poolGain);
    const myValueSats = myC + myGainSats;
    return delay({
      chamaId,
      name: chama?.name ?? "",
      myContributionSats: myC,
      mySharePct,
      myValueSats,
      myGainSats,
      poolContributionsSats: poolC,
      poolValueSats: poolV,
    });
  }
  return req<MyChamaStake>(`/chama/${chamaId}/stake`);
}

// Returns 12 monthly growth points (my cumulative contributed vs my value).
// TODO(backend): GET /chama/{id}/growth — from interest_distributions + ledger snapshots
export async function getChamaGrowth(chamaId: string): Promise<ChamaGrowthPoint[]> {
  if (USE_MOCKS) return delay([...(mockGrowthData[chamaId] ?? [])]);
  return req<ChamaGrowthPoint[]>(`/chama/${chamaId}/growth`);
}

// Returns aggregated portfolio across all chamas the user is a member of.
// TODO(backend): GET /chama/portfolio — aggregate stakes from all member chamas
export async function getChamaPortfolio(): Promise<ChamaPortfolio> {
  if (USE_MOCKS) {
    const memberChamas = mockAllChamas.filter((c) => c.isMember);
    const stakes: MyChamaStake[] = memberChamas.map((chama) => {
      const myC = chama.myContributionSats ?? 0;
      const poolC = chama.poolContributionsSats ?? 0;
      const poolV = chama.poolValueSats ?? chama.balanceSats;
      const mySharePct = poolC > 0 ? (myC / poolC) * 100 : 0;
      const poolGain = poolV - poolC;
      const myGainSats = Math.round((mySharePct / 100) * poolGain);
      return {
        chamaId: chama.id,
        name: chama.name,
        myContributionSats: myC,
        mySharePct,
        myValueSats: myC + myGainSats,
        myGainSats,
        poolContributionsSats: poolC,
        poolValueSats: poolV,
      };
    });
    const totalContributedSats = stakes.reduce((s, x) => s + x.myContributionSats, 0);
    const totalValueSats = stakes.reduce((s, x) => s + x.myValueSats, 0);
    const totalGainSats = stakes.reduce((s, x) => s + x.myGainSats, 0);
    return delay({ stakes, totalContributedSats, totalValueSats, totalGainSats });
  }
  return req<ChamaPortfolio>(`/chama/portfolio`);
}

// Withdraws from the user's proportional share of a chama pool.
// PIN must be verified server-side even though the UI collects it.
// TODO(backend): POST /chama/{id}/withdraw — verify PIN + chama withdrawal rules
export async function withdrawFromChama(chamaId: string, sats: number): Promise<{ ok: boolean }> {
  if (USE_MOCKS) {
    const chama = mockAllChamas.find((c) => c.id === chamaId);
    if (chama) {
      chama.balanceSats = Math.max(0, chama.balanceSats - sats);
      if (chama.myContributionSats !== undefined) {
        chama.myContributionSats = Math.max(0, chama.myContributionSats - sats);
      }
    }
    return delay({ ok: true });
  }
  return req<{ ok: boolean }>(`/chama/${chamaId}/withdraw`, {
    method: "POST", body: JSON.stringify({ sats }),
  });
}

// ── Mlinzi (Fund Steward) — friends & family investor program ──────────────
// PHASE 2: public access opens after CBK sandbox/licensing. Until then this
// whole feature is gated to verified family/friends.
// TODO(backend): custody, settlement, real verification (KYC-lite for F&F), realtime notifications.

export const CBK_DECLINE_MESSAGE =
  "Access isn't available yet. YeboBank's investment service is currently limited to the founder's family and friends while we complete Central Bank of Kenya (CBK) regulatory approval. Once we're licensed, this will open to the public — we'll let you know.";

const MLINZI_HANDLE = "@stanley";

export async function getInvestorPositionForHandle(handle: string): Promise<InvestorPosition | null> {
  if (USE_MOCKS) {
    const pos = mockInvestorPositions.find((p) => p.investorHandle === handle);
    return delay(pos ? { ...pos } : null);
  }
  return req<InvestorPosition | null>(`/steward/investors/${encodeURIComponent(handle)}`);
}

export async function getMlinziFIProfile(): Promise<FIProfile> {
  if (USE_MOCKS) {
    const existing = mockFIProfiles[MLINZI_HANDLE];
    if (existing) return delay({ ...existing });
    const fresh: FIProfile = { handle: MLINZI_HANDLE, annualExpensesKes: 6_000_000, fiRule: 0.04, assumedReturnPctAnnual: 20 };
    mockFIProfiles[MLINZI_HANDLE] = fresh;
    return delay({ ...fresh });
  }
  return req<FIProfile>("/steward/fi");
}

export async function setMlinziFIProfile(profile: FIProfile): Promise<FIProfile> {
  if (USE_MOCKS) {
    mockFIProfiles[profile.handle] = profile;
    return delay({ ...profile });
  }
  return req<FIProfile>("/steward/fi", { method: "POST", body: JSON.stringify(profile) });
}

function pushNotification(toHandle: string, kind: AppNotification["kind"], body: string): AppNotification {
  const n: AppNotification = { id: `nt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, toHandle, kind, body, createdAt: new Date().toISOString(), read: false };
  mockNotifications.push(n);
  return n;
}

// ---- income sources (Mlinzi) --------------------------------------------------
// TODO(backend): GET /steward/income
export async function getIncomeSources(): Promise<IncomeSource[]> {
  if (USE_MOCKS) return delay([...mockIncomeSources]);
  return req<IncomeSource[]>("/steward/income");
}

// TODO(backend): POST /steward/income (create or update)
export async function upsertIncomeSource(source: IncomeSource): Promise<IncomeSource> {
  if (USE_MOCKS) {
    const idx = mockIncomeSources.findIndex((s) => s.id === source.id);
    if (idx >= 0) mockIncomeSources[idx] = source;
    else mockIncomeSources.push({ ...source, id: source.id || `is_${Date.now()}` });
    return delay(source);
  }
  return req<IncomeSource>("/steward/income", { method: "POST", body: JSON.stringify(source) });
}

// TODO(backend): DELETE /steward/income/{id}
export async function removeIncomeSource(id: string): Promise<{ ok: boolean }> {
  if (USE_MOCKS) {
    const idx = mockIncomeSources.findIndex((s) => s.id === id);
    if (idx >= 0) mockIncomeSources.splice(idx, 1);
    return delay({ ok: true });
  }
  return req<{ ok: boolean }>(`/steward/income/${id}`, { method: "DELETE" });
}

// ---- investor positions (Mlinzi) -----------------------------------------------
// TODO(backend): GET /steward/investors
export async function getInvestorPositions(): Promise<InvestorPosition[]> {
  if (USE_MOCKS) return delay([...mockInvestorPositions]);
  return req<InvestorPosition[]>("/steward/investors");
}

// TODO(backend): POST /steward/investors
export async function addInvestorPosition(pos: Omit<InvestorPosition, "id" | "monthlyStatements">): Promise<InvestorPosition> {
  if (USE_MOCKS) {
    const created: InvestorPosition = { ...pos, id: `ip_${Date.now()}`, monthlyStatements: [] };
    mockInvestorPositions.push(created);
    return delay(created);
  }
  return req<InvestorPosition>("/steward/investors", { method: "POST", body: JSON.stringify(pos) });
}

// Posts an append-only monthly statement. Fee = 2% of return, only if return > 0.
// TODO(backend): POST /steward/investors/{positionId}/statements  records must be append-only
export async function postMonthlyStatement(positionId: string, returnKes: number): Promise<InvestorPosition> {
  if (USE_MOCKS) {
    const pos = mockInvestorPositions.find((p) => p.id === positionId);
    if (!pos) throw new Error(`Investor position ${positionId} not found`);
    const last = pos.monthlyStatements[pos.monthlyStatements.length - 1];
    const opening = last ? last.closingKes : pos.principalKesAtEntry;
    const feeKes = returnKes > 0 ? Math.round(returnKes * 0.02) : 0;
    const closingKes = opening + returnKes - feeKes;
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    pos.monthlyStatements.push({ month, openingKes: opening, returnKes, feeKes, closingKes });
    pushNotification(pos.investorHandle, "statement", `Your ${month} statement is ready: ${returnKes >= 0 ? "+" : ""}KES ${returnKes.toLocaleString()} return.`);
    return delay({ ...pos });
  }
  return req<InvestorPosition>(`/steward/investors/${positionId}/statements`, { method: "POST", body: JSON.stringify({ returnKes }) });
}

// ---- access requests (Mlinzi review) -------------------------------------------
// TODO(backend): GET /steward/access
export async function getAccessRequests(): Promise<AccessRequest[]> {
  if (USE_MOCKS) return delay([...mockAccessRequests]);
  return req<AccessRequest[]>("/steward/access");
}

// TODO(backend): POST /steward/access/{handle}/accept
export async function acceptAccess(handle: string, relationship: "family" | "friend" | "investor"): Promise<AccessRequest> {
  if (USE_MOCKS) {
    const r = mockAccessRequests.find((a) => a.handle === handle);
    if (!r) throw new Error(`Access request for ${handle} not found`);
    r.status = "accepted";
    if (handle === MOCK_HANDLE) {
      mockUser.relationship = relationship;
      mockUser.ffVerified = true;
      mockUser.accessStatus = "accepted";
      if (!mockInvestorPositions.find((p) => p.investorHandle === MOCK_HANDLE)) {
        mockInvestorPositions.push({
          id: `ip_${Date.now()}`, investorHandle: MOCK_HANDLE, investorName: mockUser.fullName,
          relationship, principalSats: 0, principalKesAtEntry: 0,
          entryDate: new Date().toISOString(), realizedReturnPctAnnual: 20, compounding: true,
          monthlyStatements: [],
        });
      }
    }
    pushNotification(handle, "access_accepted", "Karibu — your investor access is approved");
    return delay({ ...r });
  }
  return req<AccessRequest>(`/steward/access/${encodeURIComponent(handle)}/accept`, { method: "POST", body: JSON.stringify({ relationship }) });
}

// TODO(backend): POST /steward/access/{handle}/decline
export async function declineAccess(handle: string): Promise<AccessRequest> {
  if (USE_MOCKS) {
    const r = mockAccessRequests.find((a) => a.handle === handle);
    if (!r) throw new Error(`Access request for ${handle} not found`);
    r.status = "declined";
    if (handle === MOCK_HANDLE) mockUser.accessStatus = "declined";
    pushNotification(handle, "access_declined", CBK_DECLINE_MESSAGE);
    return delay({ ...r });
  }
  return req<AccessRequest>(`/steward/access/${encodeURIComponent(handle)}/decline`, { method: "POST" });
}

// ---- withdrawals (Mlinzi review) -----------------------------------------------
// TODO(backend): GET /steward/withdrawals
export async function getWithdrawalRequests(): Promise<WithdrawalRequest[]> {
  if (USE_MOCKS) return delay([...mockWithdrawalRequests]);
  return req<WithdrawalRequest[]>("/steward/withdrawals");
}

// TODO(backend): POST /steward/withdrawals/{id}/approve
export async function approveWithdrawal(id: string, expectedDeliveryDate: string, note?: string): Promise<WithdrawalRequest> {
  if (USE_MOCKS) {
    const wr = mockWithdrawalRequests.find((w) => w.id === id);
    if (!wr) throw new Error(`Withdrawal ${id} not found`);
    wr.status = "approved";
    wr.expectedDeliveryDate = expectedDeliveryDate;
    wr.mlinziNote = note;
    pushNotification(wr.investorHandle, "withdrawal_update", `Your withdrawal request was approved. Expected delivery: ${new Date(expectedDeliveryDate).toLocaleDateString()}.`);
    return delay({ ...wr });
  }
  return req<WithdrawalRequest>(`/steward/withdrawals/${id}/approve`, { method: "POST", body: JSON.stringify({ expectedDeliveryDate, note }) });
}

// TODO(backend): POST /steward/withdrawals/{id}/decline
export async function declineWithdrawal(id: string, note?: string): Promise<WithdrawalRequest> {
  if (USE_MOCKS) {
    const wr = mockWithdrawalRequests.find((w) => w.id === id);
    if (!wr) throw new Error(`Withdrawal ${id} not found`);
    wr.status = "declined";
    wr.mlinziNote = note;
    pushNotification(wr.investorHandle, "withdrawal_update", `Your withdrawal request was declined.${note ? ` Note: ${note}` : ""}`);
    return delay({ ...wr });
  }
  return req<WithdrawalRequest>(`/steward/withdrawals/${id}/decline`, { method: "POST", body: JSON.stringify({ note }) });
}

// ---- member/investor side ------------------------------------------------------
// TODO(backend): POST /invest/request
export async function requestAccess(): Promise<{ ok: boolean }> {
  if (USE_MOCKS) {
    mockUser.accessStatus = "requested";
    const existing = mockAccessRequests.find((a) => a.handle === MOCK_HANDLE);
    if (existing) existing.status = "requested";
    else mockAccessRequests.push({ handle: MOCK_HANDLE, name: mockUser.fullName, requestedAt: new Date().toISOString(), status: "requested" });
    return delay({ ok: true });
  }
  return req<{ ok: boolean }>("/invest/request", { method: "POST" });
}

// TODO(backend): GET /invest/me
export async function getMyPosition(): Promise<InvestorPosition | null> {
  if (USE_MOCKS) {
    const pos = mockInvestorPositions.find((p) => p.investorHandle === MOCK_HANDLE);
    return delay(pos ? { ...pos } : null);
  }
  return req<InvestorPosition | null>("/invest/me");
}

// TODO(backend): GET /invest/fi
export async function getFIProfile(): Promise<FIProfile> {
  if (USE_MOCKS) {
    const existing = mockFIProfiles[MOCK_HANDLE];
    if (existing) return delay({ ...existing });
    const fresh: FIProfile = { handle: MOCK_HANDLE, annualExpensesKes: 1_200_000, fiRule: 0.04, assumedReturnPctAnnual: 20 };
    mockFIProfiles[MOCK_HANDLE] = fresh;
    return delay({ ...fresh });
  }
  return req<FIProfile>("/invest/fi");
}

// TODO(backend): POST /invest/fi
export async function setFIProfile(profile: FIProfile): Promise<FIProfile> {
  if (USE_MOCKS) {
    mockFIProfiles[profile.handle] = profile;
    return delay({ ...profile });
  }
  return req<FIProfile>("/invest/fi", { method: "POST", body: JSON.stringify(profile) });
}

// No self-service payout — Mlinzi must approve. Capital may be deployed/illiquid.
// TODO(backend): POST /invest/withdraw
export async function requestWithdrawal(sats: number): Promise<WithdrawalRequest> {
  if (USE_MOCKS) {
    const wr: WithdrawalRequest = { id: `wr_${Date.now()}`, investorHandle: MOCK_HANDLE, amountSats: sats, requestedAt: new Date().toISOString(), status: "requested" };
    mockWithdrawalRequests.push(wr);
    return delay(wr);
  }
  return req<WithdrawalRequest>("/invest/withdraw", { method: "POST", body: JSON.stringify({ sats }) });
}

// TODO(backend): GET /invest/notifications
export async function getMyNotifications(): Promise<AppNotification[]> {
  if (USE_MOCKS) return delay(mockNotifications.filter((n) => n.toHandle === MOCK_HANDLE));
  return req<AppNotification[]>("/invest/notifications");
}

// TODO(backend): POST /invest/notifications/{id}/read
export async function markRead(id: string): Promise<{ ok: boolean }> {
  if (USE_MOCKS) {
    const n = mockNotifications.find((x) => x.id === id);
    if (n) n.read = true;
    return delay({ ok: true });
  }
  return req<{ ok: boolean }>(`/invest/notifications/${id}/read`, { method: "POST" });
}

// ── Pool capital deployment (Mlinzi) ─────────────────────────────────────────

// TODO(backend): GET /steward/pool/deployments
export async function getPoolDeployments(): Promise<PoolDeployment[]> {
  if (USE_MOCKS) return delay([...mockPoolDeployments].reverse());
  return req<PoolDeployment[]>("/steward/pool/deployments");
}

// Moves pool capital to an external destination so the Mlinzi can invest it.
// M-Pesa: sends to the given phone; Lightning: pays the invoice or address.
// TODO(backend): POST /steward/pool/deploy — debit pool_wallet ledger, record deployment,
//   then fan-out the appropriate rails (M-Pesa B2C or Lightning payment).
export async function deployPoolCapital(
  method: "mpesa" | "lightning",
  amountSats: number,
  amountKes: number,
  destination: string,
  notes?: string,
): Promise<PoolDeployment> {
  if (USE_MOCKS) {
    const dep: PoolDeployment = {
      id: `pd_${Date.now()}`, method, amountSats, amountKes,
      destination, notes, deployedAt: new Date().toISOString(),
    };
    mockPoolDeployments.push(dep);
    return delay(dep);
  }
  return req<PoolDeployment>("/steward/pool/deploy", {
    method: "POST",
    body: JSON.stringify({ method, amountSats, amountKes, destination, notes }),
  });
}

// ── Lock messages (activity / chat) ──────────────────────────────────────────

// TODO(backend): GET /savings/{id}/messages — fetch activity/chat for a lock
export async function getLockMessages(lockId: string): Promise<LockMessage[]> {
  if (USE_MOCKS) return delay([...(mockLockMessages[lockId] ?? [])]);
  return req<LockMessage[]>(`/savings/${lockId}/messages`);
}

// Posts a deposit or text message into a lock's activity feed.
// TODO(backend): POST /savings/{id}/messages — persist + fan-out notification to every
//   participant's chat in realtime (multi-member locks only).
//   For chama-kind locks, also mirror the deposit message into the linked chama chat.
export async function postLockMessage(
  lockId: string,
  msg: Omit<LockMessage, "id" | "lockId" | "createdAt">,
): Promise<LockMessage> {
  if (USE_MOCKS) {
    const newMsg: LockMessage = {
      ...msg, id: `lm_${Date.now()}`, lockId, createdAt: new Date().toISOString(),
    };
    if (!mockLockMessages[lockId]) mockLockMessages[lockId] = [];
    mockLockMessages[lockId].push(newMsg);
    return delay(newMsg);
  }
  return req<LockMessage>(`/savings/${lockId}/messages`, {
    method: "POST", body: JSON.stringify(msg),
  });
}
