"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { useRate } from "@/lib/rate-context";
import { fmtKES, num, timeAgo } from "@/lib/format";
import { addToLock, getLock, getLockMessages, postLockMessage } from "@/lib/api";
import { ATMCard } from "@/components/app/ATMCard";
import type { LockMessage, Rate, SavingsLock } from "@/types";
import ContributeModal from "@/components/app/ContributeModal";
import WhatsAppBar from "@/components/app/WhatsAppBar";

// TODO(backend): derive from session cookie on the server
const CURRENT_HANDLE = "@wanjiku";
const CURRENT_NAME   = "Wanjiku Kamau";

const KIND_LABEL: Record<string, string> = {
  individual: "Individual",
  group: "Group",
  chama: "Chama",
};

// ── helpers ───────────────────────────────────────────────────────────────────

function progressPct(lock: SavingsLock): number {
  const start = new Date(lock.lockedAt).getTime();
  const end   = new Date(lock.maturesAt).getTime();
  return Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100));
}

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

// ── LockMessageBubble — reuses chama chat CSS classes exactly ─────────────────

function LockMessageBubble({
  msg,
  isHighlighted,
}: {
  msg: LockMessage;
  isHighlighted: boolean;
}) {
  const isOwn    = msg.authorHandle === CURRENT_HANDLE;
  const isSystem = msg.kind === "system";

  if (isSystem) {
    return (
      <div className="msg system-msg">
        <div className="msg-bubble">{msg.body}</div>
        <div className="msg-time">{timeAgo(msg.createdAt)}</div>
      </div>
    );
  }

  const bubbleClass =
    msg.kind === "deposit"
      ? `msg-bubble deposit-bubble${isHighlighted ? " deposit-highlight" : ""}`
      : "msg-bubble";

  return (
    <div className={`msg ${isOwn ? "own" : "other"}`}>
      {!isOwn && (
        <div className="msg-author">
          {msg.authorName} · {msg.authorHandle}
        </div>
      )}
      <div className={bubbleClass}>{msg.body}</div>
      <div className="msg-time">
        {isHighlighted ? "Just now" : timeAgo(msg.createdAt)}
      </div>
    </div>
  );
}

// ── ParticipantItem — reuses .member-item / .member-av CSS exactly ────────────

function ParticipantItem({
  p,
  rate,
}: {
  p: { handle: string; name: string; contributedSats: number };
  rate: Rate;
}) {
  return (
    <div className="member-item">
      <div className="member-av">{initials(p.name)}</div>
      <div className="member-info">
        <div className="name">{p.name}</div>
        <div className="handle">{p.handle}</div>
      </div>
      <div className="member-bal">
        <div>{num(p.contributedSats)} sats</div>
        <div style={{ fontSize: 10, color: "var(--soft)" }}>≈ {fmtKES(p.contributedSats, rate, 0)}</div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LockDetailPage() {
  const params       = useParams<{ id: string }>();
  const id           = params.id;
  const rate         = useRate();
  const searchParams = useSearchParams();

  const [lock, setLock]           = useState<SavingsLock | null>(null);
  // Displayed newest-first so the just-made deposit appears at the top
  const [messages, setMessages]   = useState<LockMessage[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [contributeModal, setContributeModal] = useState(false);
  const [contributing, setContributing]       = useState(false);
  const [justDepositedId, setJustDepositedId] = useState<string | null>(null);
  const [chatExpanded, setChatExpanded] = useState(false);

  const highlightRef    = useRef<HTMLDivElement>(null);
  // Read once on mount: was this page reached after a deposit?
  const wasJustDeposited = useRef(searchParams.get("justDeposited") === "1");

  const loadAll = useCallback(async () => {
    const [l, msgs] = await Promise.all([getLock(id), getLockMessages(id)]);
    setLock(l);
    // Reverse so newest is index 0 (top of feed)
    setMessages([...msgs].reverse());
    setPageLoading(false);
  }, [id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // After messages load, highlight the most recent deposit if redirected here post-payment
  useEffect(() => {
    if (!wasJustDeposited.current || messages.length === 0) return;
    wasJustDeposited.current = false; // run once only
    const newest = messages.find((m) => m.kind === "deposit");
    if (!newest) return;
    setJustDepositedId(newest.id);
    const t = setTimeout(() => setJustDepositedId(null), 4000);
    return () => clearTimeout(t);
  }, [messages]);

  // Scroll highlighted message into view
  useEffect(() => {
    if (justDepositedId) {
      highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [justDepositedId]);

  useEffect(() => {
    if (!chatExpanded) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setChatExpanded(false); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chatExpanded]);

  async function handleContribute(sats: number) {
    if (!lock) return;
    setContributing(true);
    const updated = await addToLock(lock.id, sats);
    const isMultiMember = (updated.participants?.length ?? 0) > 1;
    // Always post for personal activity log; multi-member fans out to all participants.
    // TODO(backend): fan-out notification to every participant's chat in realtime (multi-member)
    // TODO(backend): for chama-kind locks, also mirror into the linked chama chat
    const msg = await postLockMessage(lock.id, {
      kind: "deposit",
      authorHandle: CURRENT_HANDLE,
      authorName: CURRENT_NAME,
      body: `${CURRENT_NAME} deposited ${fmtKES(sats, rate, 0)} (~${num(sats)} sats).`,
      meta: { sats, multiMember: isMultiMember },
    });
    setMessages((prev) => [msg, ...prev]); // newest at top
    setJustDepositedId(msg.id);
    setTimeout(() => setJustDepositedId(null), 4000);
    setLock(updated);
    setContributing(false);
    setContributeModal(false);
  }

  if (pageLoading) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        <p className="note">Loading…</p>
      </div>
    );
  }

  if (!lock) {
    return (
      <>
        <h1 className="page-title">Lock not found</h1>
        <Link href="/savings">
          <Button variant="ghost" style={{ marginTop: 16 }}>← Back to savings</Button>
        </Link>
      </>
    );
  }

  const kind          = lock.kind ?? "individual";
  const pct           = progressPct(lock);
  const canContribute = lock.status === "active";
  const isMultiMember = (lock.participants?.length ?? 0) > 1;
  const maturesDate   = new Date(lock.maturesAt).toLocaleDateString("en-KE", {
    year: "numeric", month: "long", day: "numeric",
  });
  const lockedDate = new Date(lock.lockedAt).toLocaleDateString("en-KE", {
    year: "numeric", month: "short", day: "numeric",
  });

  return (
    <>
      <ATMCard variant="compact"
        sats={lock ? lock.principalSats + lock.accruedSats : undefined}
        balanceLabel="LOCK VALUE"
      />

      {/* Header — mirrors chama dashboard */}
      <div className="section-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Link href="/savings" style={{ color: "var(--soft)", fontSize: 14 }}>
              <i className="ti ti-layout-list" /> Savings
            </Link>
          </div>
          <h1 className="page-title">{lock.title ?? "Savings lock"}</h1>
          <p className="page-sub">
            <span className={`lock-kind-badge badge-${kind}`}>
              {KIND_LABEL[kind] ?? kind}
            </span>
            {" · "}{lock.lockYears}yr lock · matures {maturesDate}
          </p>
        </div>
        {kind === "chama" && lock.chamaId && (
          <Link href={`/chama/${lock.chamaId}`}>
            <Button variant="ghost">
              <i className="ti ti-users" /> View chama
            </Button>
          </Link>
        )}
      </div>

      {/* Action row — mirrors chama dashboard */}
      <div className="chama-actions">
        {canContribute && (
          <Button variant="primary" onClick={() => setContributeModal(true)}>
            <i className="ti ti-plus" /> Add contribution
          </Button>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid-2">
        <div className="card">
          <div className="stat">
            <span className="l">Principal</span>
            <span className="v">{num(lock.principalSats)} sats</span>
          </div>
          <p className="note" style={{ marginTop: 8 }}>≈ {fmtKES(lock.principalSats, rate, 0)}</p>
        </div>
        <div className="card">
          <div className="stat">
            <span className="l">Accrued interest</span>
            <span className="v" style={{ color: "var(--emerald-deep)" }}>
              +{num(lock.accruedSats)} sats
            </span>
          </div>
          <p className="note" style={{ marginTop: 8 }}>≈ {fmtKES(lock.accruedSats, rate, 0)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>
            Time elapsed
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--soft)" }}>
            {pct.toFixed(1)}%
          </span>
        </div>
        <div className="bar-track">
          <div className="bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="note" style={{ marginTop: 8 }}>Locked {lockedDate}</p>
      </div>

      {/* ── Multi-member: chama-grid layout (participants + chat) ── */}
      {isMultiMember ? (
        <div className="chama-grid">
          {/* Participants sidebar — reuses .member-item CSS from chama */}
          <div className="card">
            <div style={{ marginBottom: 12 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16 }}>
                Participants ({lock.participants!.length})
              </h2>
            </div>
            {lock.participants!.map((p) => (
              <ParticipantItem key={p.handle} p={p} rate={rate} />
            ))}
          </div>

          {/* Activity panel — reuses .chama-chat CSS */}
          <div className={`card chama-chat${chatExpanded ? " chat-fs" : ""}`}>
            <div className="chat-head">
              <h2>Activity</h2>
              <button
                className="chat-expand-btn"
                onClick={() => setChatExpanded((v) => !v)}
                aria-label={chatExpanded ? "Exit fullscreen" : "Expand chat"}
                title={chatExpanded ? "Exit fullscreen (Esc)" : "Expand to fullscreen"}
              >
                <i className={`ti ${chatExpanded ? "ti-arrows-minimize" : "ti-arrows-maximize"}`} />
              </button>
            </div>
            <div className="chat-msgs">
              {messages.length === 0 && (
                <p className="note" style={{ textAlign: "center", padding: "20px 0" }}>
                  No activity yet.
                </p>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  ref={msg.id === justDepositedId ? highlightRef : undefined}
                >
                  <LockMessageBubble msg={msg} isHighlighted={msg.id === justDepositedId} />
                </div>
              ))}
            </div>
            <WhatsAppBar groupName={lock.title ?? "Group Savings"} />
          </div>
        </div>
      ) : (
        /* ── Single-member: simple activity list, no chat ── */
        messages.length > 0 && (
          <div className="card" style={{ marginTop: 16 }}>
            <h2 style={{
              fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, marginBottom: 12,
            }}>
              Activity
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {messages.map((msg, i) => {
                const isHighlighted = msg.id === justDepositedId;
                const isDeposit     = msg.kind === "deposit";
                return (
                  <div
                    key={msg.id}
                    ref={isHighlighted ? highlightRef : undefined}
                    style={{
                      padding: "10px 12px",
                      borderRadius: isDeposit && isHighlighted ? "var(--r-sm)" : 0,
                      borderBottom: i < messages.length - 1 ? "1px solid var(--border-soft)" : "none",
                      background: isDeposit
                        ? isHighlighted
                          ? "rgba(17,166,91,.14)"
                          : "rgba(17,166,91,.06)"
                        : "transparent",
                      transition: "background .4s",
                    }}
                  >
                    <div style={{
                      fontSize: 13,
                      color: isDeposit ? "var(--emerald-deep)" : "var(--muted)",
                      fontWeight: isDeposit ? 500 : 400,
                    }}>
                      {msg.body}
                    </div>
                    <div style={{
                      fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--soft)", marginTop: 2,
                    }}>
                      {isHighlighted ? "Just now" : timeAgo(msg.createdAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Contribute modal */}
      {contributeModal && (
        <ContributeModal
          lock={lock}
          onConfirm={handleContribute}
          onCancel={() => setContributeModal(false)}
          loading={contributing}
        />
      )}
    </>
  );
}
