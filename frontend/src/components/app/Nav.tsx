"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/api";
import { mockUser } from "@/lib/mock";
import LogoMark from "@/components/ui/LogoMark";

const ACCOUNT = [{ href: "/settings", icon: "ti-settings", label: "Settings" }];

function getRoleFlags() {
  const isMlinzi  = mockUser.role === "mlinzi";
  const isAgent   = mockUser.isAgent;
  const canInvest = isMlinzi || mockUser.accessStatus === "accepted";
  return { isMlinzi, isAgent, canInvest };
}

export function Sidebar() {
  const path     = usePathname();
  const router   = useRouter();
  const isActive = (h: string) => path === h || path.startsWith(h + "/");
  const { isMlinzi, isAgent, canInvest } = getRoleFlags();

  async function onLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <aside className="sidebar">
      <Link href="/dashboard" className="brand"><LogoMark size={34} /> YeboBank</Link>

      <div className="side-sec">Wallet</div>
      <Link href="/dashboard" className={`side-link${isActive("/dashboard") ? " active" : ""}`}>
        <i className="ti ti-home" /> Dashboard
      </Link>

      {isAgent && (
        <>
          <div className="side-sec">Agent</div>
          <Link href="/agent" className={`side-link${isActive("/agent") ? " active" : ""}`}>
            <i className="ti ti-cash" /> Agent console
          </Link>
        </>
      )}

      {canInvest && !isMlinzi && (
        <>
          <div className="side-sec">Investments</div>
          <Link href="/invest" className={`side-link${isActive("/invest") ? " active" : ""}`}>
            <i className="ti ti-trending-up" /> Invest portal
          </Link>
        </>
      )}

      {isMlinzi && (
        <>
          <div className="side-sec">Mlinzi</div>
          <Link href="/mlinzi" className={`side-link${isActive("/mlinzi") ? " active" : ""}`}>
            <i className="ti ti-shield-lock" /> Mlinzi console
          </Link>
          <Link href="/invest" className={`side-link${isActive("/invest") ? " active" : ""}`}>
            <i className="ti ti-trending-up" /> Invest portal
          </Link>
        </>
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
  const { isMlinzi, isAgent, canInvest } = getRoleFlags();

  const roleSlot = isMlinzi
    ? { href: "/mlinzi", icon: "ti-shield-lock", label: "Console" }
    : isAgent
    ? { href: "/agent",  icon: "ti-cash",        label: "Agent" }
    : canInvest
    ? { href: "/invest", icon: "ti-trending-up", label: "Invest" }
    : null;

  const bottom = [
    { href: "/dashboard", icon: "ti-home",     label: "Home" },
    ...(roleSlot ? [roleSlot] : []),
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
