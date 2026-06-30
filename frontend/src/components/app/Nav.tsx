"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/api";
import { mockUser } from "@/lib/mock";

const WALLET = [
  { href: "/dashboard", icon: "ti-home", label: "Dashboard" },
  { href: "/deposit", icon: "ti-arrow-down", label: "Add money" },
  { href: "/withdraw", icon: "ti-arrow-up", label: "Withdraw" },
  { href: "/send", icon: "ti-send", label: "Send / Receive" },
  { href: "/history", icon: "ti-list", label: "History" },
];
const GROW = [
  { href: "/savings", icon: "ti-lock", label: "Savings" },
  { href: "/chama", icon: "ti-users", label: "Chamas" },
  { href: "/agent", icon: "ti-cash", label: "Agent" },
  { href: "/invest", icon: "ti-trending-up", label: "Invest" },
];
const ACCOUNT = [{ href: "/settings", icon: "ti-settings", label: "Settings" }];

export function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const isActive = (h: string) => path === h || path.startsWith(h + "/");
  // role-gated: Mlinzi Console (fund steward admin tools) is only for the mlinzi role.
  const isMlinzi = mockUser.role === "mlinzi";

  async function onLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <aside className="sidebar">
      <Link href="/dashboard" className="brand"><span className="mk">Y</span> YeboBank</Link>
      <div className="side-sec">Wallet</div>
      {WALLET.map((l) => (
        <Link key={l.href} href={l.href} className={`side-link${isActive(l.href) ? " active" : ""}`}>
          <i className={`ti ${l.icon}`} /> {l.label}
        </Link>
      ))}
      <div className="side-sec">Grow</div>
      {GROW.map((l) => (
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

const BOTTOM = [
  { href: "/dashboard", icon: "ti-home", label: "Home" },
  { href: "/send", icon: "ti-send", label: "Send" },
  { href: "/savings", icon: "ti-lock", label: "Savings" },
  { href: "/chama", icon: "ti-users", label: "Chamas" },
  { href: "/invest", icon: "ti-trending-up", label: "Invest" },
  { href: "/settings", icon: "ti-settings", label: "Account" },
];

export function BottomNav() {
  const path = usePathname();
  const isActive = (h: string) => path === h || path.startsWith(h + "/");
  return (
    <nav className="bottom-nav">
      {BOTTOM.map((l) => (
        <Link key={l.href} href={l.href} className={`bn-link${isActive(l.href) ? " active" : ""}`}>
          <i className={`ti ${l.icon}`} />
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
