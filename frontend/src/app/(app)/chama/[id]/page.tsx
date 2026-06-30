"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { useRate } from "@/lib/rate-context";
import { num, fmtKES, kesToSats, timeAgo } from "@/lib/format";
import {
  getChama, getChamaMessages, getChamaVotes, getChamaJoinRequests,
  postChamaMessage, createChamaVote, castVote,
  voteOnJoin, chamaDeposit, chamaTransfer,
  getMyStake, getChamaGrowth, withdrawFromChama, createChamaLock,
} from "@/lib/api";
import { ATMCard } from "@/components/app/ATMCard";
import type { Chama, ChamaMember, ChamaMessage, ChamaVote, JoinRequest, Rate, MyChamaStake as StakeType, ChamaGrowthPoint } from "@/types";
import MyChamaStakePanel from "@/components/app/MyChamaStake";
import ChamaGrowthChart from "@/components/app/ChamaGrowthChart";

// TODO(backend): realtime/polling — replace these one-shot loads with
// WebSocket subscription or polling (every ~5s) so all members see live state.
const CURRENT_HANDLE = "@wanjiku";
const CURRENT_NAME   = "Wanjiku Kamau";

// ── helpers ──────────────────────────────────────────────────────────────────

const _MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function dateToLabel(date: string): string {
  const [, m] = date.split("-");
  return _MONTHS[(parseInt(m, 10) - 1) % 12] ?? date;
}

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

type ParseResult =
  | { kind: "text" }
  | { kind: "deposit"; sats: number; displayBody: string }
  | { kind: "transfer"; toHandle: string; sats: number; displayBody: string }
  | { kind: "vote"; question: string; options: string[] }
  | { kind: "error"; message: string };

function parseCommand(raw: string, rate: Rate, chamaMembers: ChamaMember[]): ParseResult {
  const trimmed = raw.trim().replace(/^\//, ""); // strip optional leading /

  // Deposit: deposit [Ksh|KES] <amount> [sats]
  const depMatch = trimmed.match(/^deposit\s+(?:(ksh|kes)\s+)?(\d+(?:\.\d+)?)\s*(sats?)?$/i);
  if (depMatch) {
    const amount = parseFloat(depMatch[2]);
    const isSats = !!depMatch[3];
    if (isNaN(amount) || amount <= 0) return { kind: "error", message: "Invalid amount." };
    const sats = isSats ? Math.round(amount) : kesToSats(amount, rate);
    const displayBody = isSats
      ? `${CURRENT_NAME} deposited ${num(sats)} sats.`
      : `${CURRENT_NAME} deposited KES ${num(amount)} (~${num(sats)} sats).`;
    return { kind: "deposit", sats, displayBody };
  }

  // Send: send @handle [Ksh|KES] <amount> [sats]
  const sendMatch = trimmed.match(/^send\s+(@\w+)\s+(?:(ksh|kes)\s+)?(\d+(?:\.\d+)?)\s*(sats?)?$/i);
  if (sendMatch) {
    const toHandle = sendMatch[1].toLowerCase();
    const amount = parseFloat(sendMatch[3]);
    const isSats = !!sendMatch[4];
    if (isNaN(amount) || amount <= 0) return { kind: "error", message: "Invalid amount." };
    const inChama = chamaMembers.some((m) => m.handle.toLowerCase() === toHandle);
    if (!inChama) return { kind: "error", message: `${toHandle} is not a member of this chama.` };
    if (toHandle === CURRENT_HANDLE) return { kind: "error", message: "You cannot send to yourself." };
    const sats = isSats ? Math.round(amount) : kesToSats(amount, rate);
    const recipient = chamaMembers.find((m) => m.handle.toLowerCase() === toHandle);
    const displayBody = isSats
      ? `${CURRENT_NAME} sent ${num(sats)} sats to ${recipient?.name ?? toHandle}.`
      : `${CURRENT_NAME} sent KES ${num(amount)} (~${num(sats)} sats) to ${recipient?.name ?? toHandle}.`;
    return { kind: "transfer", toHandle, sats, displayBody };
  }

  // Vote: vote "question" opt1 opt2 [opt3 opt4]
  const voteMatch = trimmed.match(/^vote\s+"([^"]+)"\s+(.+)$/i);
  if (voteMatch) {
    const question = voteMatch[1].trim();
    const options = voteMatch[2].trim().split(/\s+/).filter(Boolean);
    if (options.length < 2) {
      return { kind: "error", message: 'Vote needs at least 2 options. Example: vote "Increase contribution?" yes no' };
    }
    if (options.length > 4) {
      return { kind: "error", message: "Vote supports at most 4 options." };
    }
    return { kind: "vote", question, options };
  }

  // Looks like a command attempt but didn't match
  if (/^(deposit|send|vote)\s/i.test(trimmed)) {
    return {
      kind: "error",
      message: 'Command not recognized. Try: deposit Ksh 500 · send @jane 200 · vote "question" yes no',
    };
  }

  return { kind: "text" };
}

function approvalThreshold(memberCount: number): number {
  // Need strictly > 75% — e.g. 12 members → need 10
  return Math.floor(memberCount * 0.75) + 1;
}

function downloadStatement(chama: Chama, messages: ChamaMessage[]) {
  // TODO(backend): server-side PDF generation via GET /chama/{id}/statement
  const myMsgs = messages.filter(
    (m) =>
      m.authorHandle === CURRENT_HANDLE ||
      m.meta?.toHandle === CURRENT_HANDLE ||
      m.meta?.fromHandle === CURRENT_HANDLE,
  );
  const header = [
    `Chama Statement — ${chama.name}`,
    `Member: ${CURRENT_NAME} (${CURRENT_HANDLE})`,
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "Date,Type,Amount (sats),Notes",
  ];
  const rows = myMsgs.map(
    (m) =>
      `"${m.createdAt}","${m.kind}","${m.meta?.sats ?? ""}","${m.body.replace(/"/g, '""')}"`,
  );
  const csv = [...header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${chama.name.replace(/\s+/g, "_")}_statement.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── sub-components ────────────────────────────────────────────────────────────

function MemberItem({ member, rate }: { member: ChamaMember; rate: Rate }) {
  return (
    <div className="member-item">
      <div className={`member-av${member.role === "admin" ? " admin" : ""}`}>
        {initials(member.name)}
      </div>
      <div className="member-info">
        <div className="name">{member.name}</div>
        <div className="handle">{member.handle}</div>
      </div>
      <div className="member-bal">
        <div>{num(member.balanceSats)} sats</div>
        <div style={{ fontSize: 10, color: "var(--soft)" }}>≈ {fmtKES(member.balanceSats, rate, 0)}</div>
      </div>
    </div>
  );
}

function VoteCard({
  vote, memberCount, onCast,
}: {
  vote: ChamaVote;
  memberCount: number;
  onCast: (voteId: string, option: string) => void;
}) {
  const allVoters = new Set(Object.values(vote.tallies).flat());
  const myVote = vote.options.find((o) => vote.tallies[o]?.includes(CURRENT_HANDLE));
  const totalVotes = allVoters.size;
  const needed = approvalThreshold(memberCount);

  return (
    <div className="vote-card">
      <div className="vote-q">{vote.question}</div>
      <div className="vote-opt-row">
        {vote.options.map((opt) => {
          const count = vote.tallies[opt]?.length ?? 0;
          const pct = memberCount > 0 ? (count / memberCount) * 100 : 0;
          const isChosen = myVote === opt;
          return (
            <div key={opt}>
              <button
                className={`vote-opt${isChosen ? " chosen" : ""}`}
                disabled={vote.status !== "open"}
                onClick={() => onCast(vote.id, opt)}
              >
                <span className="opt-label">{opt}</span>
                <span className="opt-count">{count} vote{count !== 1 ? "s" : ""}</span>
              </button>
              <div className="vote-bar-track">
                <div className="vote-bar-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="vote-status">
        {vote.status === "open" ? (
          <span className="badge pending">Open</span>
        ) : vote.status === "passed" ? (
          <span className="badge confirmed">Passed</span>
        ) : (
          <span className="badge failed">No majority</span>
        )}
        <span>{totalVotes}/{memberCount} voted</span>
      </div>
      {vote.status === "open" && (
        <div className="vote-need">Need {needed} votes for a decision.</div>
      )}
    </div>
  );
}

function JoinRequestCard({
  jr, memberCount, onApprove,
}: {
  jr: JoinRequest;
  memberCount: number;
  onApprove: (requestId: string) => void;
}) {
  const needed = approvalThreshold(memberCount);
  const pct = Math.min(100, (jr.approvals.length / needed) * 100);
  const alreadyApproved = jr.approvals.includes(CURRENT_HANDLE);

  return (
    <div className="join-card">
      <div className="join-who">{jr.requesterName}</div>
      <div className="join-handle">{jr.requesterHandle} · wants to join</div>
      <div className="join-progress-track">
        <div className="join-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="join-approval-text">
        {jr.approvals.length} of {memberCount} approvals (need {needed})
      </div>
      {jr.status === "pending" && (
        <div className="join-actions">
          <Button
            variant="primary"
            disabled={alreadyApproved}
            onClick={() => onApprove(jr.id)}
            style={{ fontSize: 13, padding: "8px 14px" }}
          >
            {alreadyApproved ? "Approved ✓" : "Approve"}
          </Button>
          <span className="badge pending">Pending</span>
        </div>
      )}
      {jr.status === "approved" && <span className="badge confirmed">Approved</span>}
      {jr.status === "rejected" && <span className="badge failed">Rejected</span>}
    </div>
  );
}

function MessageBubble({
  msg, votes, joinRequests, memberCount, onCastVote, onApproveJoin,
}: {
  msg: ChamaMessage;
  votes: ChamaVote[];
  joinRequests: JoinRequest[];
  memberCount: number;
  onCastVote: (voteId: string, option: string) => void;
  onApproveJoin: (requestId: string) => void;
}) {
  const isOwn = msg.authorHandle === CURRENT_HANDLE;
  const isSystem = msg.kind === "system";

  if (isSystem) {
    return (
      <div className="msg system-msg">
        <div className="msg-bubble">{msg.body}</div>
        <div className="msg-time">{timeAgo(msg.createdAt)}</div>
      </div>
    );
  }

  if (msg.kind === "vote") {
    const voteId = msg.meta?.voteId as string | undefined;
    const vote = votes.find((v) => v.id === voteId);
    return (
      <div className={`msg ${isOwn ? "own" : "other"}`}>
        {!isOwn && <div className="msg-author">{msg.authorName} · {msg.authorHandle}</div>}
        {vote ? (
          <VoteCard vote={vote} memberCount={memberCount} onCast={onCastVote} />
        ) : (
          <div className="msg-bubble">{msg.body}</div>
        )}
        <div className="msg-time">{timeAgo(msg.createdAt)}</div>
      </div>
    );
  }

  if (msg.kind === "join_request") {
    const reqId = msg.meta?.requestId as string | undefined;
    const jr = joinRequests.find((r) => r.id === reqId);
    return (
      <div className={`msg ${isOwn ? "own" : "other"}`}>
        {jr ? (
          <JoinRequestCard jr={jr} memberCount={memberCount} onApprove={onApproveJoin} />
        ) : (
          <div className="msg-bubble">{msg.body}</div>
        )}
        <div className="msg-time">{timeAgo(msg.createdAt)}</div>
      </div>
    );
  }

  const bubbleClass =
    msg.kind === "deposit"    ? "msg-bubble deposit-bubble"
    : msg.kind === "withdrawal" ? "msg-bubble withdrawal-bubble"
    : msg.kind === "transfer" ? "msg-bubble transfer-bubble"
    : "msg-bubble";

  return (
    <div className={`msg ${isOwn ? "own" : "other"}`}>
      {!isOwn && <div className="msg-author">{msg.authorName} · {msg.authorHandle}</div>}
      <div className={bubbleClass}>{msg.body}</div>
      <div className="msg-time">{timeAgo(msg.createdAt)}</div>
    </div>
  );
}

// ── PIN modal ─────────────────────────────────────────────────────────────────

function PinModal({
  label,
  onConfirm,
  onCancel,
}: {
  label: string;
  onConfirm: (pin: string) => void;
  onCancel: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") onCancel();
  }

  function handleConfirm() {
    if (pin.length < 6) { setError("Enter your full 6-digit PIN."); return; }
    // TODO(backend): verify PIN — currently accepts any 6 digits
    onConfirm(pin);
  }

  return (
    <div className="modal-overlay" onKeyDown={handleKey}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="pin-title">
        <button className="modal-close" onClick={onCancel} aria-label="Close">✕</button>
        <h2 id="pin-title">Confirm transfer</h2>
        <p className="modal-sub">{label}</p>
        <p style={{ fontSize: 14, marginBottom: 8, color: "var(--muted)" }}>
          Enter your 6-digit transaction PIN to proceed.
        </p>

        {/* Hidden real input for accessibility + keyboard */}
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
          className="pin-input-hidden"
          aria-label="PIN"
        />

        {/* Visual dots */}
        <div className="pin-grid" onClick={() => inputRef.current?.focus()}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`pin-cell${i < pin.length ? " filled" : ""}${i === pin.length ? " focused" : ""}`}
            >
              {i < pin.length ? "•" : ""}
            </div>
          ))}
        </div>

        {error && <p style={{ color: "var(--red)", fontSize: 13, marginTop: 4 }}>{error}</p>}

        <div className="modal-actions">
          <Button onClick={handleConfirm} disabled={pin.length < 6}>
            Confirm send
          </Button>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ── Vote creation modal ───────────────────────────────────────────────────────

function VoteModal({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: (question: string, options: string[]) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  function setOpt(idx: number, val: string) {
    setOptions((prev) => prev.map((o, i) => (i === idx ? val : o)));
  }
  function addOpt() { if (options.length < 4) setOptions((p) => [...p, ""]); }
  function removeOpt(idx: number) { if (options.length > 2) setOptions((p) => p.filter((_, i) => i !== idx)); }

  function handleSubmit() {
    const q = question.trim();
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (!q || opts.length < 2) return;
    onConfirm(q, opts);
  }

  return (
    <div className="modal-overlay">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="vote-title">
        <button className="modal-close" onClick={onCancel} aria-label="Close">✕</button>
        <h2 id="vote-title">New vote</h2>
        <p className="modal-sub">Create a poll for all chama members.</p>

        <div className="field-group">
          <label>Question</label>
          <input
            className="input"
            placeholder='e.g. "Should we pay out to Jane?"'
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        <div className="vote-opt-inputs">
          {options.map((opt, i) => (
            <div className="opt-row" key={i}>
              <input
                className="input"
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) => setOpt(i, e.target.value)}
              />
              {options.length > 2 && (
                <button className="rm-btn" onClick={() => removeOpt(i)} aria-label="Remove option">✕</button>
              )}
            </div>
          ))}
          {options.length < 4 && (
            <button className="add-opt" onClick={addOpt}>+ Add option</button>
          )}
        </div>

        <div className="modal-actions">
          <Button
            onClick={handleSubmit}
            disabled={loading || !question.trim() || options.filter((o) => o.trim()).length < 2}
          >
            {loading ? "Creating…" : "Start vote"}
          </Button>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ── Contribute modal ──────────────────────────────────────────────────────────

function ContributeModal({
  chama, rate, onConfirm, onCancel, loading,
}: {
  chama: Chama;
  rate: Rate;
  onConfirm: (sats: number) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [kes, setKes] = useState(String(Math.round(chama.contributionSats * rate.kesPerSat)));
  const sats = kesToSats(parseFloat(kes) || 0, rate);

  return (
    <div className="modal-overlay">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="contrib-title">
        <button className="modal-close" onClick={onCancel} aria-label="Close">✕</button>
        <h2 id="contrib-title">Contribute</h2>
        <p className="modal-sub">Deposit into {chama.name}.</p>

        <div className="field-group" style={{ marginBottom: 10 }}>
          <label>Amount (KES)</label>
          <input
            className="input"
            type="number"
            min="1"
            value={kes}
            onChange={(e) => setKes(e.target.value)}
          />
        </div>
        <p className="note" style={{ marginBottom: 16 }}>
          ≈ {num(sats)} sats at current rate
        </p>

        <div className="modal-actions">
          <Button onClick={() => onConfirm(sats)} disabled={loading || sats <= 0}>
            {loading ? "Processing…" : `Deposit ${num(sats)} sats`}
          </Button>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ── Withdraw modal ────────────────────────────────────────────────────────────

function WithdrawModal({
  stake, rate, onConfirm, onCancel, loading,
}: {
  stake: StakeType;
  rate: Rate;
  onConfirm: (sats: number, pin: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [unit, setUnit] = useState<"KES" | "sats">("KES");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  const sats = unit === "KES"
    ? kesToSats(parseFloat(amount) || 0, rate)
    : Math.round(parseFloat(amount) || 0);
  const maxKES = Math.round(stake.myValueSats * rate.kesPerSat);
  const overMax = sats > stake.myValueSats;
  const canSubmit = !loading && sats > 0 && !overMax && pin.length === 6;

  function handleConfirm() {
    if (pin.length < 6) { setPinError("Enter your full 6-digit PIN."); return; }
    // TODO(backend): verify PIN — currently accepts any 6 digits
    onConfirm(sats, pin);
  }

  return (
    <div className="modal-overlay">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="withdraw-title">
        <button className="modal-close" onClick={onCancel} aria-label="Close">✕</button>
        <h2 id="withdraw-title">Withdraw from chama</h2>
        <p className="modal-sub">
          Max: {num(stake.myValueSats)} sats (≈ KES {num(maxKES)})
        </p>

        <div className="seg" style={{ marginBottom: 14 }}>
          <button className={unit === "KES" ? "on" : ""} onClick={() => setUnit("KES")}>KES</button>
          <button className={unit === "sats" ? "on" : ""} onClick={() => setUnit("sats")}>sats</button>
        </div>

        <div className="field-group" style={{ marginBottom: 8 }}>
          <label>Amount ({unit})</label>
          <input
            className="input"
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {amount !== "" && (
          <p className="note" style={{ marginBottom: 14 }}>
            {unit === "KES"
              ? `≈ ${num(sats)} sats`
              : `≈ KES ${num(Math.round(sats * rate.kesPerSat))}`}
            {overMax && <span style={{ color: "var(--red)", marginLeft: 8 }}>Exceeds your value</span>}
          </p>
        )}

        <div className="field-group" style={{ marginBottom: 8 }}>
          <label>6-digit PIN</label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            className="input"
            placeholder="••••••"
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setPinError(""); }}
          />
        </div>
        {pinError && <p style={{ color: "var(--red)", fontSize: 13, marginTop: 4 }}>{pinError}</p>}

        <div className="modal-actions">
          <Button onClick={handleConfirm} disabled={!canSubmit}>
            {loading ? "Processing…" : "Withdraw"}
          </Button>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ChamaDashboard() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const rate = useRate();

  const [chama, setChama] = useState<Chama | null>(null);
  const [messages, setMessages] = useState<ChamaMessage[]>([]);
  const [votes, setVotes] = useState<ChamaVote[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [stake, setStake] = useState<StakeType | null>(null);
  const [growthPoints, setGrowthPoints] = useState<ChamaGrowthPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // withdraw modal
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  // composer
  const [input, setInput] = useState("");
  const [cmdError, setCmdError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // PIN modal
  const [pinModal, setPinModal] = useState<{ label: string; action: (pin: string) => Promise<void> } | null>(null);

  // Vote modal
  const [voteModal, setVoteModal] = useState(false);
  const [voteCreating, setVoteCreating] = useState(false);

  // Contribute modal
  const [contributeModal, setContributeModal] = useState(false);
  const [contributing, setContributing] = useState(false);

  // Chat fullscreen
  const [chatExpanded, setChatExpanded] = useState(false);

  // Lock intent (from ?intent=lock&amount=...&years=... query string)
  const searchParams = useSearchParams();
  const router = useRouter();
  const [lockIntentOpen, setLockIntentOpen] = useState(false);
  const [lockIntentSats, setLockIntentSats] = useState(0);
  const [lockIntentYears, setLockIntentYears] = useState(5);
  const [lockCreating, setLockCreating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const members = chama?.members ?? [];

  const loadAll = useCallback(async () => {
    const [c, msgs, vs, jrs, st, gp] = await Promise.all([
      getChama(id),
      getChamaMessages(id),
      getChamaVotes(id),
      getChamaJoinRequests(id),
      getMyStake(id),
      getChamaGrowth(id),
    ]);
    setChama(c);
    setMessages(msgs);
    setVotes(vs);
    setJoinRequests(jrs);
    setStake(st);
    setGrowthPoints(gp);
    setLoading(false);
  }, [id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!chatExpanded) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setChatExpanded(false); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chatExpanded]);

  useEffect(() => {
    if (searchParams.get("intent") === "lock") {
      setLockIntentSats(parseInt(searchParams.get("amount") ?? "0", 10) || 0);
      setLockIntentYears(parseInt(searchParams.get("years") ?? "5", 10) || 5);
      setLockIntentOpen(true);
    }
  }, [searchParams]);

  async function handleSend() {
    const raw = input.trim();
    if (!raw || sending || !chama) return;
    setCmdError(null);

    const parsed = parseCommand(raw, rate, members);

    if (parsed.kind === "error") {
      setCmdError(parsed.message);
      return;
    }

    if (parsed.kind === "text") {
      setSending(true);
      setInput("");
      const msg = await postChamaMessage(id, {
        kind: "text",
        authorHandle: CURRENT_HANDLE,
        authorName: CURRENT_NAME,
        body: raw,
      });
      setMessages((p) => [...p, msg]);
      setSending(false);
      return;
    }

    if (parsed.kind === "deposit") {
      setSending(true);
      setInput("");
      await chamaDeposit(id, parsed.sats);
      const msg = await postChamaMessage(id, {
        kind: "deposit",
        authorHandle: CURRENT_HANDLE,
        authorName: CURRENT_NAME,
        body: parsed.displayBody,
        meta: { sats: parsed.sats, fromHandle: CURRENT_HANDLE },
      });
      setMessages((p) => [...p, msg]);
      setChama((c) => c ? { ...c, balanceSats: c.balanceSats + parsed.sats } : c);
      setSending(false);
      return;
    }

    if (parsed.kind === "transfer") {
      setInput("");
      const { toHandle, sats, displayBody } = parsed;
      const label = displayBody;
      setPinModal({
        label,
        action: async () => {
          // TODO(backend): verify PIN — currently accepts any 6-digit input
          setSending(true);
          await chamaTransfer(id, toHandle, sats);
          const msg = await postChamaMessage(id, {
            kind: "transfer",
            authorHandle: CURRENT_HANDLE,
            authorName: CURRENT_NAME,
            body: displayBody,
            meta: { sats, fromHandle: CURRENT_HANDLE, toHandle },
          });
          setMessages((p) => [...p, msg]);
          setSending(false);
        },
      });
      return;
    }

    if (parsed.kind === "vote") {
      setInput("");
      const { question, options } = parsed;
      setSending(true);
      const vote = await createChamaVote(id, question, options);
      setVotes((p) => [...p, vote]);
      const msg = await postChamaMessage(id, {
        kind: "vote",
        authorHandle: CURRENT_HANDLE,
        authorName: CURRENT_NAME,
        body: `New vote: ${question}`,
        meta: { voteId: vote.id },
      });
      setMessages((p) => [...p, msg]);
      setSending(false);
      return;
    }
  }

  async function handleCastVote(voteId: string, option: string) {
    const updated = await castVote(id, voteId, option);
    setVotes((p) => p.map((v) => (v.id === voteId ? updated : v)));
    // Reload messages to pick up any system conclusion message
    const msgs = await getChamaMessages(id);
    setMessages(msgs);
  }

  async function handleApproveJoin(requestId: string) {
    const updated = await voteOnJoin(id, requestId, true);
    setJoinRequests((p) => p.map((r) => (r.id === requestId ? updated : r)));
    // Reload messages + chama data to pick up new member + system message
    const [msgs, c] = await Promise.all([getChamaMessages(id), getChama(id)]);
    setMessages(msgs);
    setChama(c);
  }

  async function handleContribute(sats: number) {
    setContributing(true);
    await chamaDeposit(id, sats);
    const msg = await postChamaMessage(id, {
      kind: "deposit",
      authorHandle: CURRENT_HANDLE,
      authorName: CURRENT_NAME,
      body: `${CURRENT_NAME} deposited ${fmtKES(sats, rate, 0)} (~${num(sats)} sats).`,
      meta: { sats, fromHandle: CURRENT_HANDLE },
    });
    setMessages((p) => [...p, msg]);
    setChama((c) => c ? { ...c, balanceSats: c.balanceSats + sats } : c);
    setContributing(false);
    setContributeModal(false);
  }

  async function handleCreateVote(question: string, options: string[]) {
    setVoteCreating(true);
    const vote = await createChamaVote(id, question, options);
    setVotes((p) => [...p, vote]);
    const msg = await postChamaMessage(id, {
      kind: "vote",
      authorHandle: CURRENT_HANDLE,
      authorName: CURRENT_NAME,
      body: `New vote: ${question}`,
      meta: { voteId: vote.id },
    });
    setMessages((p) => [...p, msg]);
    setVoteCreating(false);
    setVoteModal(false);
  }

  async function handleWithdraw(sats: number) {
    setWithdrawing(true);
    await withdrawFromChama(id, sats);
    // Post a withdrawal message — mirrors the deposit flow exactly
    const msg = await postChamaMessage(id, {
      kind: "withdrawal",
      authorHandle: CURRENT_HANDLE,
      authorName: CURRENT_NAME,
      body: `${CURRENT_NAME} withdrew ${fmtKES(sats, rate, 0)} (~${num(sats)} sats).`,
      meta: { amountSats: sats, fromHandle: CURRENT_HANDLE },
    });
    setMessages((p) => [...p, msg]);
    // Decrement the displayed group balance — mirrors how deposit increments it
    setChama((c) => c ? { ...c, balanceSats: Math.max(0, c.balanceSats - sats) } : c);
    // Refresh stake to reflect new values
    const updated = await getMyStake(id);
    setStake(updated);
    setWithdrawing(false);
    setWithdrawModal(false);
    setWithdrawSuccess(true);
    setTimeout(() => setWithdrawSuccess(false), 4000);
  }

  function handleCopyInvite() {
    const link = `${window.location.origin}/chama/discover`;
    navigator.clipboard.writeText(link).catch(() => {});
    // Simple feedback — in real app would toast
    alert(`Chama: ${chama?.name}\nInvite link copied to clipboard:\n${link}`);
  }

  async function handleCreateChamaLock() {
    if (!chama || lockIntentSats <= 0) return;
    setLockCreating(true);
    await createChamaLock(chama.id, lockIntentSats, lockIntentYears);
    setLockCreating(false);
    setLockIntentOpen(false);
    router.push("/savings");
  }

  if (loading) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        <p className="note">Loading chama…</p>
      </div>
    );
  }

  if (!chama) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        <p className="note">Chama not found.</p>
        <Link href="/chama"><Button variant="ghost" style={{ marginTop: 16 }}>← Back</Button></Link>
      </div>
    );
  }

  const pendingJoinRequests = joinRequests.filter((r) => r.status === "pending");

  return (
    <>
      <ATMCard variant="compact"
        sats={stake?.myValueSats}
        balanceLabel="MY CHAMA STAKE"
      />

      {/* Header */}
      <div className="section-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Link href="/chama" style={{ color: "var(--soft)", fontSize: 14 }}>
              <i className="ti ti-arrow-left" /> Chamas
            </Link>
          </div>
          <h1 className="page-title">{chama.name}</h1>
          <p className="page-sub">
            {chama.memberCount} members ·{" "}
            Group balance: {fmtKES(chama.balanceSats, rate, 0)}{" "}
            <span style={{ color: "var(--soft)", fontSize: 13 }}>({num(chama.balanceSats)} sats)</span>
          </p>
        </div>
        {pendingJoinRequests.length > 0 && (
          <span className="badge pending">
            <i className="ti ti-user-check" /> {pendingJoinRequests.length} pending
          </span>
        )}
      </div>

      {/* Action row */}
      <div className="chama-actions">
        <Button variant="primary" onClick={() => setContributeModal(true)}>
          <i className="ti ti-arrow-down" /> Contribute
        </Button>
        <Button variant="ghost" onClick={() => setWithdrawModal(true)} disabled={!stake || stake.myValueSats <= 0}>
          <i className="ti ti-arrow-up" /> Withdraw
        </Button>
        <Button variant="ghost" onClick={handleCopyInvite}>
          <i className="ti ti-share" /> Invite/Share
        </Button>
        <Button variant="gold" onClick={() => setVoteModal(true)}>
          <i className="ti ti-check-box" /> New vote
        </Button>
        <Button variant="ghost" onClick={() => downloadStatement(chama, messages)}>
          <i className="ti ti-file-download" /> Statement
        </Button>
      </div>

      {withdrawSuccess && (
        <div className="notif-banner" style={{ background: "rgba(17,166,91,.12)", borderColor: "rgba(17,166,91,.3)" }}>
          <i className="ti ti-circle-check" style={{ color: "var(--emerald-deep)" }} />
          <span>Withdrawal submitted. {/* TODO(backend): POST /chama/{id}/withdraw — settle via ledger */}</span>
        </div>
      )}

      {/* My stake + growth */}
      {stake && stake.myContributionSats > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <MyChamaStakePanel stake={stake} />
          {growthPoints.length >= 2 && (
            <div style={{ marginTop: 20 }}>
              <ChamaGrowthChart
                title="Your growth over time"
                defaultSeriesKey="value"
                currencyMode="KES"
                series={[
                  {
                    key: "value",
                    label: "Your value",
                    color: "var(--gold)",
                    points: growthPoints.map((p) => ({
                      label: dateToLabel(p.date),
                      valueSats: p.valueSats,
                    })),
                  },
                  {
                    key: "contributed",
                    label: "Contributed",
                    color: "var(--forest-mid)",
                    points: growthPoints.map((p) => ({
                      label: dateToLabel(p.date),
                      valueSats: p.contributedSats,
                    })),
                  },
                ]}
              />
            </div>
          )}
        </div>
      )}

      {/* Main grid */}
      <div className="chama-grid">
        {/* Members sidebar */}
        <div className="card">
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16 }}>
              Members ({members.length})
            </h2>
          </div>
          {members.map((m) => (
            <MemberItem key={m.id} member={m} rate={rate} />
          ))}
        </div>

        {/* Chat panel */}
        <div className={`card chama-chat${chatExpanded ? " chat-fs" : ""}`}>
          <div className="chat-head">
            <h2>Chat</h2>
            <button
              className="chat-expand-btn"
              onClick={() => setChatExpanded((v) => !v)}
              aria-label={chatExpanded ? "Exit fullscreen" : "Expand chat"}
              title={chatExpanded ? "Exit fullscreen (Esc)" : "Expand to fullscreen"}
            >
              <i className={`ti ${chatExpanded ? "ti-arrows-minimize" : "ti-arrows-maximize"}`} />
            </button>
          </div>

          {/* TODO(backend): poll or subscribe for shared realtime state */}
          <div className="chat-msgs">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                votes={votes}
                joinRequests={joinRequests}
                memberCount={chama.memberCount}
                onCastVote={handleCastVote}
                onApproveJoin={handleApproveJoin}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-composer">
            {cmdError && <div className="cmd-error"><i className="ti ti-alert-circle" /> {cmdError}</div>}
            <div className="composer-row">
              <textarea
                rows={1}
                placeholder="Message or /command…"
                value={input}
                onChange={(e) => { setInput(e.target.value); setCmdError(null); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                className="composer-send"
                onClick={handleSend}
                disabled={sending || !input.trim()}
                aria-label="Send"
              >
                <i className="ti ti-send" />
              </button>
            </div>
            <p className="cmd-hint">
              Try: <code>deposit Ksh 500</code> · <code>send @jane 200</code> · <code>vote &quot;question&quot; yes no</code>
            </p>
          </div>
        </div>
      </div>

      {/* PIN modal */}
      {pinModal && (
        <PinModal
          label={pinModal.label}
          onConfirm={async (pin) => {
            const action = pinModal.action;
            setPinModal(null);
            await action(pin);
          }}
          onCancel={() => setPinModal(null)}
        />
      )}

      {/* Vote creation modal */}
      {voteModal && (
        <VoteModal
          onConfirm={handleCreateVote}
          onCancel={() => setVoteModal(false)}
          loading={voteCreating}
        />
      )}

      {/* Contribute modal */}
      {contributeModal && (
        <ContributeModal
          chama={chama}
          rate={rate}
          onConfirm={handleContribute}
          onCancel={() => setContributeModal(false)}
          loading={contributing}
        />
      )}

      {/* Withdraw modal */}
      {withdrawModal && stake && (
        <WithdrawModal
          stake={stake}
          rate={rate}
          onConfirm={(sats) => handleWithdraw(sats)}
          onCancel={() => setWithdrawModal(false)}
          loading={withdrawing}
        />
      )}

      {/* Lock intent modal — fires when ?intent=lock is in the URL */}
      {lockIntentOpen && chama && (
        <div className="modal-overlay">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="lock-intent-title">
            <button className="modal-close" onClick={() => setLockIntentOpen(false)} aria-label="Close">✕</button>
            <h2 id="lock-intent-title">Create chama lock</h2>
            <p className="modal-sub">Lock savings in {chama.name} and earn yield together.</p>
            <div className="stat" style={{ marginBottom: 10 }}>
              <span className="l">Initial contribution</span>
              <span className="v">{num(lockIntentSats)} sats</span>
            </div>
            <p className="note" style={{ marginBottom: 6 }}>
              ≈ KES {num(lockIntentSats * rate.kesPerSat)} · {lockIntentYears}yr lock
            </p>
            <p className="note" style={{ marginBottom: 16 }}>
              Projected yield at ~5.2%: +{num(Math.round(lockIntentSats * (Math.pow(1.052, lockIntentYears) - 1)))} sats (illustrative)
            </p>
            <p className="note" style={{ marginBottom: 4 }}>
              All chama members can contribute after the lock is created.
            </p>
            <div className="modal-actions">
              <Button onClick={handleCreateChamaLock} disabled={lockCreating || lockIntentSats <= 0}>
                {lockCreating ? "Creating…" : `Lock ${num(lockIntentSats)} sats`}
              </Button>
              <Button variant="ghost" onClick={() => setLockIntentOpen(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
