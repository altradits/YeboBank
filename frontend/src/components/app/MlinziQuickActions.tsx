"use client";

import Link from "next/link";

interface QuickAction {
  href: string;
  icon: string;
  label: string;
  desc: string;
  accent: string;
  bg: string;
  badge?: number;
}

interface MlinziQuickActionsProps {
  pendingAccess: number;
  pendingWithdrawals: number;
}

export default function MlinziQuickActions({ pendingAccess, pendingWithdrawals }: MlinziQuickActionsProps) {
  const actions: QuickAction[] = [
    {
      href: "/mlinzi/deploy",
      icon: "ti-send-2",
      label: "Deploy Capital",
      desc: "M-Pesa, Lightning, or card",
      accent: "var(--gold)",
      bg: "rgba(168,116,0,.1)",
    },
    {
      href: "/mlinzi/investors",
      icon: "ti-users-group",
      label: "Investors",
      desc: "Positions + statements",
      accent: "var(--emerald-deep)",
      bg: "rgba(7,122,60,.1)",
    },
    {
      href: "/mlinzi/access",
      icon: "ti-user-check",
      label: "Access Requests",
      desc: "Approve or decline",
      accent: "var(--lime)",
      bg: "rgba(150,194,68,.1)",
      badge: pendingAccess,
    },
    {
      href: "/mlinzi/withdrawals",
      icon: "ti-arrow-up-circle",
      label: "Withdrawals",
      desc: "Queue + delivery dates",
      accent: "var(--terra)",
      bg: "rgba(188,80,22,.1)",
      badge: pendingWithdrawals,
    },
    {
      href: "/mlinzi/income",
      icon: "ti-chart-bar",
      label: "Income Sources",
      desc: "Real-estate, bonds, funds",
      accent: "var(--gold-soft)",
      bg: "rgba(196,144,32,.1)",
    },
    {
      href: "/mlinzi/card",
      icon: "ti-credit-card",
      label: "Virtual Card",
      desc: "Auto-rotating CVV",
      accent: "var(--forest-mid)",
      bg: "rgba(26,92,60,.1)",
    },
  ];

  return (
    <div className="card mlinzi-qa">
      <h2 className="mlinzi-qa-title">Quick actions</h2>
      <div className="mlinzi-qa-grid">
        {actions.map((a) => (
          <Link key={a.href} href={a.href} className="mlinzi-qa-item">
            <div className="mqa-icon" style={{ background: a.bg, color: a.accent }}>
              <i className={`ti ${a.icon}`} />
              {a.badge && a.badge > 0 && (
                <span className="mqa-badge">{a.badge}</span>
              )}
            </div>
            <span className="mqa-label">{a.label}</span>
            <span className="mqa-desc">{a.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
