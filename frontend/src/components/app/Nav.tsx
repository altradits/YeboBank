"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/api";
import { mockUser } from "@/lib/mock";
import LogoMark from "@/components/ui/LogoMark";

const WALLET = [
  { href: "/dashboard", icon: "ti-home", label: "Dashboard" },
  { href: "/history",   icon: "ti-list", label: "History" },
];
const GROW_BASE = [
  { href: "/savings", icon: "ti-lock",  label: "Savings" },
  { href: "/chama",   icon: "ti-users", label: "Chamas" },
];
const ACCOUNT = [{ href: "/settings", icon: "ti-settings", label: "Settings" }];

// Role helpers — synchronous reads from mockUser; swap for a context when the
// real auth layer lands.
function getRoleFlags() {
  const isMlinzi  = mockUser.role === "mlinzi";
  const isAgent   = mockUser.isAgent;
  // Invest portal is visible to the Mlinzi and accepted F&F investors only.
  const canInvest = isMlinzi || mockUser.accessStatus === "accepted";
  return { isMlinzi, isAgent, canInvest };
}

export function Sidebar() {
  const path     = usePathname();
  const router   = useRouter();
  const isActive = (h: string) => path === h || path.startsWith(h + "/");
  const { isMlinzi, isAgent, canInvest } = getRoleFlags();

  const grow = [
    ...GROW_BASE,
    ...(isAgent   ? [{ href: "/agent",  icon: "ti-cash",        label: "Agent" }]  : []),
    ...(canInvest ? [{ href: "/invest", icon: "ti-trending-up", label: "Invest" }] : []),
  ];

  async function onLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <aside className="sidebar">
      <Link href="/dashboard" className="brand"><LogoMark size={34} /> YeboBank</Link>
      <div className="side-sec">Wallet</div>
      {WALLET.map((l) => (
        <Link key={l.href} href={l.href} className={`side-link${isActive(l.href) ? " active" : ""}`}>
          <i className={`ti ${l.icon}`} /> {l.label}
        </Link>
      ))}
      <div className="side-sec">Grow</div>
      {grow.map((l) => (
        <Link key={l.href} href={l.href} className={`side-link${isActive(l.href) ? " active" : ""}`}>
          <i className={`ti ${l.icon}`} /> {l.label}
        </Link>
      ))}
      {isMlinzi && (
        <Link href="/steward" className={`side-link${isActive("/steward") ? " active" : ""}`}>
          <i className="ti ti-shield-lock" /> Mlinzi Console
        </Link>
      )}
      <div className="side-sec">Account</div>
      {ACCOUNT.map((l) => (
        <Link key={l.href} href={l.href} className={`side-link${isActive(l.href) ? " active" : ""}`}>
          <i className={`ti ${l.icon}`} /> {l.label}
        </Link>
      ))}
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
  const isActive = (h: string) => path === h || path.startsWith(h + "/");
  const { isAgent, canInvest } = getRoleFlags();

  // One extra slot between Chamas and Account: Agent takes priority over Invest
  // so agents see their dashboard, not the investor portal.
  const extraSlot = isAgent
    ? { href: "/agent",  icon: "ti-cash",        label: "Agent" }
    : canInvest
    ? { href: "/invest", icon: "ti-trending-up", label: "Invest" }
    : null;

  const bottom = [
    { href: "/dashboard", icon: "ti-home",     label: "Home" },
    { href: "/send",      icon: "ti-send",     label: "Send" },
    { href: "/savings",   icon: "ti-lock",     label: "Savings" },
    { href: "/chama",     icon: "ti-users",    label: "Chamas" },
    ...(extraSlot ? [extraSlot] : []),
    { href: "/settings",  icon: "ti-settings", label: "Account" },
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
