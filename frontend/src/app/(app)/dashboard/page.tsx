"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ATMCard, type ActionItem } from "@/components/app/ATMCard";
import TransactionRow from "@/components/app/TransactionRow";
import QuickActionModal, { type QuickActionKind } from "@/components/app/QuickActionModal";
import { getWallet, getHistory, getUser, getLocks, getChamas, chamaDeposit, requestAccess } from "@/lib/api";
import type { User } from "@/types";
import { num } from "@/lib/format";
import { useRate } from "@/lib/rate-context";
import type { LedgerEntry, SavingsLock, Chama } from "@/types";
import DashboardStats from "@/components/app/DashboardStats";
import NotificationsPanel from "@/components/app/NotificationsPanel";

export default function DashboardPage() {
  const rate   = useRate();
  const router = useRouter();

  const [balance,    setBalance]    = useState(0);
  const [history,    setHistory]    = useState<LedgerEntry[]>([]);
  const [firstName,  setFirstName]  = useState("Wanjiku");
  const [user,       setUser]       = useState<User | null>(null);

  // Invest access popup — the ONLY way a member interacts with investing.
  // No link ever leaves this dashboard; it's a popup, and once the Mlinzi
  // accepts, the account becomes an Investor and lives in /invest instead.
  const [investOpen,   setInvestOpen]   = useState(false);
  const [requesting,   setRequesting]   = useState(false);
  const [showAll,    setShowAll]    = useState(false);

  // Savings drawer
  const [savingsOpen, setSavingsOpen] = useState(false);
  const [locks,       setLocks]       = useState<SavingsLock[] | null>(null);

  // Chama drawer
  const [chamaOpen,   setChamaOpen]   = useState(false);
  const [chamas,      setChamas]      = useState<Chama[] | null>(null);

  // Chama inline contribution
  const [contributeId,  setContributeId]  = useState<string | null>(null);
  const [contributeKes, setContributeKes] = useState("");
  const [contributing,  setContributing]  = useState(false);
  const [contributeDone, setContributeDone] = useState(false);

  // Standalone quick-action modal
  const [quickAction, setQuickAction] = useState<QuickActionKind | null>(null);

  useEffect(() => {
    getWallet().then((w) => setBalance(w.balanceSats));
    getHistory().then(setHistory);
    getUser().then((u) => { setFirstName(u.fullName.split(" ")[0]); setUser(u); });
  }, []);

  function openSavings() {
    setSavingsOpen(true);
    if (locks === null) getLocks().then(setLocks);
  }

  function openChama() {
    setChamaOpen(true);
    if (chamas === null) getChamas().then(setChamas);
  }

  function closeChamaDrawer() {
    setChamaOpen(false);
    setContributeId(null);
    setContributeKes("");
    setContributeDone(false);
  }

  async function onContribute(chamaId: string) {
    const sats = Math.round(parseFloat(contributeKes.replace(/[^0-9.]/g, "")) * (rate.satsPerKes ?? 0));
    if (!sats || sats <= 0) return;
    setContributing(true);
    try {
      await chamaDeposit(chamaId, sats);
      setChamas((prev) =>
        prev ? prev.map((c) =>
          c.id === chamaId ? { ...c, myContributionSats: (c.myContributionSats ?? 0) + sats } : c
        ) : prev
      );
      setContributeDone(true);
      setContributeKes("");
      setTimeout(() => { setContributeId(null); setContributeDone(false); }, 1800);
    } finally {
      setContributing(false);
    }
  }

  // This dashboard only ever renders for plain members (see dashboard/layout.tsx).
  // Nothing here links outside the member dashboard — investing is a popup.
  const actions: ActionItem[] = [
    { icon: "ti-arrow-down",  label: "Deposit",  action: "deposit" },
    { icon: "ti-arrow-up",    label: "Withdraw", action: "withdraw" },
    { icon: "ti-send",        label: "Send",     action: "send" },
    { icon: "ti-lock",        label: "Savings",  onClick: openSavings },
    { icon: "ti-users",       label: "Chamas",   onClick: openChama },
    { icon: "ti-trending-up", label: "Invest",   onClick: () => setInvestOpen(true) },
  ];

  const memberChamas = chamas?.filter((c) => c.isMember) ?? [];
  const shown = showAll ? history : history.slice(0, 5);
  const contributingChama = contributeId ? memberChamas.find((c) => c.id === contributeId) : null;
  const contributeSats = Math.round(parseFloat(contributeKes.replace(/[^0-9.]/g, "")) * (rate.satsPerKes ?? 0));

  const lockedSats   = (locks ?? []).reduce((s, l) => s + l.principalSats, 0);
  const interestKes  = (locks ?? []).reduce((s, l) => s + l.accruedSats, 0) * (rate.kesPerSat ?? 0);
  const targetApy    = 5.2;

  return (
    <>
      <h1 className="page-title">Habari, {firstName}</h1>
      <p className="page-sub">Here&apos;s how your money is doing today.</p>

      <div style={{ marginTop: 18 }}>
        <ATMCard sats={balance} variant="dashboard" actions={actions} />
      </div>

      {/* Stats row */}
      <DashboardStats lockedSats={lockedSats} interestKes={interestKes} targetApy={targetApy} />

      {/* Activity */}
      <div className="card" style={{ marginTop: 18 }}>
        <div className="section-head">
          <h2>Recent activity</h2>
          {history.length > 5 && (
            <button className="txtlink" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Show less" : "View all"}{" "}
              <i className={`ti ti-chevron-${showAll ? "up" : "down"}`} />
            </button>
          )}
        </div>
        {shown.map((tx) => <TransactionRow key={tx.id} tx={tx} />)}
        {history.length === 0 && (
          <p className="note">No transactions yet. Deposit to get started.</p>
        )}
      </div>

      {/* ── Invest access popup (never leaves the dashboard) ─────────────── */}
      {investOpen && (
        <div className="modal-overlay" onClick={() => setInvestOpen(false)}>
          <div className="modal" style={{ maxWidth: 440 }} role="dialog" aria-modal="true"
            aria-labelledby="invest-modal-title" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setInvestOpen(false)} aria-label="Close invest">
              <i className="ti ti-x" />
            </button>
            <h2 id="invest-modal-title">Invest with the Mlinzi</h2>
            <p className="modal-sub">Friends &amp; family pilot — access by acceptance only.</p>

            {user?.accessStatus === "requested" ? (
              <p className="note" style={{ marginTop: 14 }}>
                <i className="ti ti-clock" style={{ color: "var(--gold-text)" }} />{" "}
                Your request is with the Mlinzi for personal review. Once accepted
                and verified, your account becomes an Investor account with its own
                dashboard.
              </p>
            ) : user?.accessStatus === "declined" ? (
              <p className="note" style={{ marginTop: 14 }}>
                Access isn&apos;t available for your account right now. The pilot is
                limited to verified friends and family of the Mlinzi.
              </p>
            ) : (
              <>
                <p className="note" style={{ marginTop: 14 }}>
                  The Mlinzi personally stewards a private pool for verified friends
                  and family — real assets, monthly statements, compounded returns.
                  Request access and they will review you personally.
                </p>
                <button
                  className="btn btn-gold btn-block"
                  style={{ marginTop: 18 }}
                  disabled={requesting}
                  onClick={async () => {
                    setRequesting(true);
                    try {
                      await requestAccess();
                      const u = await getUser();
                      setUser(u);
                    } finally {
                      setRequesting(false);
                    }
                  }}
                >
                  {requesting ? "Sending…" : "Request investor access"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Notifications */}
      <NotificationsPanel />

      {/* ── Savings drawer ──────────────────────────────────────────────── */}
      {savingsOpen && (
        <div className="modal-overlay" onClick={() => setSavingsOpen(false)}>
          <div className="modal" style={{ maxWidth: 460 }} role="dialog" aria-modal="true" aria-labelledby="savings-modal-title" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSavingsOpen(false)} aria-label="Close savings">
              <i className="ti ti-x" />
            </button>
            <h2 id="savings-modal-title">Savings</h2>
            <p className="modal-sub">Your Bitcoin savings locks.</p>

            {locks === null ? (
              <p className="note">Loading…</p>
            ) : locks.length === 0 ? (
              <p className="note" style={{ marginBottom: 12 }}>No locks yet — create your first one below.</p>
            ) : (
              <div style={{ marginBottom: 4 }}>
                {locks.map((lock) => {
                  const total = lock.principalSats + lock.accruedSats;
                  const matureYear = new Date(lock.maturesAt).getFullYear();
                  return (
                    <div key={lock.id} style={{
                      padding: "12px 0",
                      borderBottom: "1px solid var(--border-soft)",
                      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
                    }}>
                      <div>
                        <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                          {lock.title ?? `${lock.lockYears}yr lock`}
                        </p>
                        <p className="note">{lock.kind ?? "individual"} · matures {matureYear}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>
                          {num(total)} sats
                        </p>
                        {lock.accruedSats > 0 && (
                          <p className="note" style={{ color: "var(--emerald-deep)" }}>
                            +{num(lock.accruedSats)} earned
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="modal-actions">
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => { setSavingsOpen(false); setQuickAction("lock"); }}
              >
                <i className="ti ti-lock" /> Lock sats
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Chama drawer ────────────────────────────────────────────────── */}
      {chamaOpen && (
        <div className="modal-overlay" onClick={closeChamaDrawer}>
          <div className="modal" style={{ maxWidth: 460 }} role="dialog" aria-modal="true" aria-labelledby="chama-modal-title" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeChamaDrawer} aria-label="Close chamas">
              <i className="ti ti-x" />
            </button>
            <h2 id="chama-modal-title">Chamas</h2>
            <p className="modal-sub">Your savings circles.</p>

            {chamas === null ? (
              <p className="note">Loading…</p>
            ) : memberChamas.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <p className="note" style={{ marginBottom: 16 }}>You&apos;re not in any chamas yet.</p>
                <button
                  className="btn btn-primary"
                  onClick={() => { closeChamaDrawer(); router.push("/chama/discover"); }}
                >
                  <i className="ti ti-search" /> Discover chamas
                </button>
              </div>
            ) : (
              <div style={{ marginBottom: 4 }}>
                {memberChamas.map((chama) => (
                  <div key={chama.id}>
                    <div style={{
                      padding: "12px 0",
                      borderBottom: contributeId === chama.id ? "none" : "1px solid var(--border-soft)",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <div>
                        <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                          {chama.name}
                        </p>
                        <p className="note">{chama.memberCount} members</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>
                            {num(chama.myContributionSats ?? 0)} sats
                          </p>
                          <p className="note">my share</p>
                        </div>
                        <button
                          onClick={() => {
                            setContributeId(contributeId === chama.id ? null : chama.id);
                            setContributeKes("");
                            setContributeDone(false);
                          }}
                          style={{
                            background: "var(--surface-2)", border: "1px solid var(--border-soft)",
                            borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600,
                            cursor: "pointer", color: "var(--text)",
                          }}
                        >
                          {contributeId === chama.id ? "Cancel" : "Add"}
                        </button>
                      </div>
                    </div>

                    {contributeId === chama.id && (
                      <div style={{
                        background: "var(--surface-2)", borderRadius: 10,
                        padding: "14px 16px", marginBottom: 8,
                        border: "1px solid var(--border-soft)",
                      }}>
                        {contributeDone ? (
                          <p style={{ color: "var(--emerald-deep)", fontWeight: 600, fontSize: 14, textAlign: "center" }}>
                            <i className="ti ti-circle-check" /> Contributed to {chama.name}
                          </p>
                        ) : (
                          <>
                            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                              Contribute to {chama.name}
                            </p>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <div style={{ flex: 1 }}>
                                <input
                                  className="amount-input"
                                  inputMode="decimal"
                                  placeholder="Amount in KES"
                                  value={contributeKes}
                                  onChange={(e) => setContributeKes(e.target.value)}
                                  style={{ fontSize: 14, padding: "8px 12px" }}
                                />
                                {contributeSats > 0 && (
                                  <p className="note" style={{ marginTop: 4 }}>≈ {num(contributeSats)} sats</p>
                                )}
                              </div>
                              <button
                                className="btn btn-primary"
                                onClick={() => onContribute(chama.id)}
                                disabled={contributing || contributeSats <= 0}
                                style={{ whiteSpace: "nowrap" }}
                              >
                                {contributing ? "…" : "Confirm"}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {memberChamas.length > 0 && (
              <div className="modal-actions">
                <button
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                  onClick={() => { closeChamaDrawer(); router.push("/chama/discover"); }}
                >
                  <i className="ti ti-search" /> Discover chamas
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Standalone quick-action (lock, contribute) */}
      {quickAction && (
        <QuickActionModal kind={quickAction} onClose={() => setQuickAction(null)} />
      )}
    </>
  );
}
