"use client";

import { useEffect, useState } from "react";
import { ATMCard, type ActionItem } from "@/components/app/ATMCard";
import TransactionRow from "@/components/app/TransactionRow";
import QuickActionModal, { type QuickActionKind } from "@/components/app/QuickActionModal";
import { getWallet, getHistory, getUser, getLocks, getChamas } from "@/lib/api";
import { num } from "@/lib/format";
import { mockUser } from "@/lib/mock";
import type { LedgerEntry, SavingsLock, Chama } from "@/types";

export default function DashboardPage() {
  const [balance,    setBalance]    = useState(0);
  const [history,    setHistory]    = useState<LedgerEntry[]>([]);
  const [firstName,  setFirstName]  = useState("Wanjiku");
  const [showAll,    setShowAll]    = useState(false);

  // Savings drawer
  const [savingsOpen,   setSavingsOpen]   = useState(false);
  const [locks,         setLocks]         = useState<SavingsLock[] | null>(null);

  // Chama drawer
  const [chamaOpen,     setChamaOpen]     = useState(false);
  const [chamas,        setChamas]        = useState<Chama[] | null>(null);

  // Standalone quick-action modal (used from savings drawer)
  const [quickAction,   setQuickAction]   = useState<QuickActionKind | null>(null);

  useEffect(() => {
    getWallet().then((w) => setBalance(w.balanceSats));
    getHistory().then(setHistory);
    getUser().then((u) => setFirstName(u.fullName.split(" ")[0]));
  }, []);

  function openSavings() {
    setSavingsOpen(true);
    if (locks === null) getLocks().then(setLocks);
  }

  function openChama() {
    setChamaOpen(true);
    if (chamas === null) getChamas().then(setChamas);
  }

  const isMlinzi  = mockUser.role === "mlinzi";
  const isAgent   = mockUser.isAgent;
  const canInvest = isMlinzi || mockUser.accessStatus === "accepted";

  const actions: ActionItem[] = [
    { icon: "ti-arrow-down",  label: "Deposit",  action: "deposit" },
    { icon: "ti-arrow-up",    label: "Withdraw", action: "withdraw" },
    { icon: "ti-send",        label: "Send",     action: "send" },
    { icon: "ti-lock",        label: "Savings",  onClick: openSavings },
    { icon: "ti-users",       label: "Chamas",   onClick: openChama },
    ...(isAgent   ? [{ icon: "ti-cash",        label: "Agent",   path: "/agent" }]   : []),
    ...(canInvest ? [{ icon: "ti-trending-up", label: "Invest",  path: "/invest" }]  : []),
    ...(isMlinzi  ? [{ icon: "ti-shield-lock", label: "Console", path: "/mlinzi" }] : []),
  ];

  const shown = showAll ? history : history.slice(0, 5);

  return (
    <>
      <h1 className="page-title">Habari, {firstName} 👋</h1>
      <p className="page-sub">Here&apos;s how your money is doing today.</p>

      <div style={{ marginTop: 18 }}>
        <ATMCard sats={balance} variant="dashboard" actions={actions} />
      </div>

      {/* Activity */}
      <div className="card" style={{ marginTop: 18 }}>
        <div className="section-head">
          <h2>Recent activity</h2>
          {history.length > 5 && (
            <button className="txtlink" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Show less" : "View all"}{" "}
              <i className={`ti ti-arrow-${showAll ? "up" : "right"}`} />
            </button>
          )}
        </div>
        {shown.map((tx) => <TransactionRow key={tx.id} tx={tx} />)}
        {history.length === 0 && (
          <p className="note">No transactions yet. Deposit to get started.</p>
        )}
      </div>

      {/* ── Savings drawer ──────────────────────────────────────────────── */}
      {savingsOpen && (
        <div className="modal-overlay" onClick={() => setSavingsOpen(false)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSavingsOpen(false)}>
              <i className="ti ti-x" />
            </button>
            <h2>Savings</h2>
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
        <div className="modal-overlay" onClick={() => setChamaOpen(false)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setChamaOpen(false)}>
              <i className="ti ti-x" />
            </button>
            <h2>Chamas</h2>
            <p className="modal-sub">Your savings circles.</p>

            {chamas === null ? (
              <p className="note">Loading…</p>
            ) : chamas.filter((c) => c.isMember).length === 0 ? (
              <p className="note" style={{ marginBottom: 12 }}>You&apos;re not in any chamas yet.</p>
            ) : (
              <div style={{ marginBottom: 4 }}>
                {chamas.filter((c) => c.isMember).map((chama) => (
                  <div key={chama.id} style={{
                    padding: "12px 0",
                    borderBottom: "1px solid var(--border-soft)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                        {chama.name}
                      </p>
                      <p className="note">{chama.memberCount} members</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>
                        {num(chama.myContributionSats ?? 0)} sats
                      </p>
                      <p className="note">my share</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions">
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => { setChamaOpen(false); setQuickAction("deposit"); }}
              >
                <i className="ti ti-arrow-down" /> Contribute
              </button>
            </div>
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
