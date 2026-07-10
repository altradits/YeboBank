"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getUser, logout } from "@/lib/api";
import { roleOf, type AppRole } from "@/lib/useRoleGate";
import LogoMark from "@/components/ui/LogoMark";

// Every role gets ONLY its own dashboard links. Nothing cross-role.
const NAV_BY_ROLE: Record<AppRole, { section: string; links: { href: string; icon: string; label: string }[] }[]> = {
  member: [
    { section: "Wallet", links: [
      { href: "/dashboard", icon: "ti-home",    label: "Dashboard" },
      { href: "/savings",   icon: "ti-lock",    label: "Savings" },
      { href: "/chama",     icon: "ti-users",   label: "Chamas" },
      { href: "/history",   icon: "ti-history", label: "History" },
    ]},
  ],
  agent: [
    { section: "Agent", links: [
      { href: "/agent", icon: "ti-cash", label: "Agent console" },
    ]},
  ],
  investor: [
    { section: "Investments", links: [
      { href: "/invest", icon: "ti-trending-up", label: "Investor dashboard" },
    ]},
  ],
  mlinzi: [
    { section: "Mlinzi", links: [
      { href: "/mlinzi", icon: "ti-shield-lock", label: "Mlinzi console" },
    ]},
  ],
};

const HOME_BY_ROLE: Record<AppRole, { href: string; icon: string; label: string }> = {
  member:   { href: "/dashboard", icon: "ti-home",         label: "Home" },
  agent:    { href: "/agent",     icon: "ti-cash",         label: "Console" },
  investor: { href: "/invest",    icon: "ti-trending-up",  label: "Invest" },
  mlinzi:   { href: "/mlinzi",    icon: "ti-shield-lock",  label: "Console" },
};

function useAppRole(): AppRole | null {
  const [role, setRole] = useState<AppRole | null>(null);
  useEffect(() => { getUser().then((u) => setRole(roleOf(u))); }, []);
  return role;
}

export function Sidebar() {
  const path     = usePathname();
  const router   = useRouter();
  const role     = useAppRole();
  const isActive = (h: string) => path === h || path.startsWith(h + "/");

  async function onLogout() {
    await logout();
    router.push("/login");
  }

  if (!role) return <aside className="sidebar" />;
  const home = HOME_BY_ROLE[role].href;

  return (
    <aside className="sidebar">
      <Link href={home} className="brand"><LogoMark size={34} /> YeboBank</Link>

      {NAV_BY_ROLE[role].map((group) => (
        <div key={group.section}>
          <div className="side-sec">{group.section}</div>
          {group.links.map((l) => (
            <Link key={l.href} href={l.href} className={`side-link${isActive(l.href) ? " active" : ""}`}>
              <i className={`ti ${l.icon}`} /> {l.label}
            </Link>
          ))}
        </div>
      ))}

      <div className="side-sec">Account</div>
      <Link href="/settings" className={`side-link${isActive("/settings") ? " active" : ""}`}>
        <i className="ti ti-settings" /> Settings
      </Link>
      <div className="side-bottom">
        <button className="side-link" onClick={onLogout} style={{ width: "100%", background: "none", cursor: "pointer" }}>
          <i className="ti ti-logout" /> Log out
        </button>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const path     = usePathname();
  const role     = useAppRole();
  const isActive = (h: string) => path === h || path.startsWith(h + "/");

  if (!role) return null;

  const bottom = [
    HOME_BY_ROLE[role],
    { href: "/settings", icon: "ti-settings", label: "Account" },
  ];

  return (
    <nav className="bottom-nav">
      {bottom.map((l) => (
        <Link key={l.href} href={l.href} className={`bn-link${isActive(l.href) ? " active" : ""}`}>
          <i className={`ti ${l.icon}`} />
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
