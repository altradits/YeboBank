"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getUser } from "@/lib/api";
import type { User } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Role model — strict, mutually exclusive dashboards.
//
//   mlinzi   → /mlinzi/**   ONLY the Mlinzi (fund steward) can enter.
//   agent    → /agent       ONLY registered agents can enter.
//   investor → /invest      ONLY verified friends & family of the Mlinzi
//                           (Stanley Thuita) with ACCEPTED access.
//   member   → /dashboard   ONLY plain members — neither investor, nor
//                           mlinzi, nor agent. Members get the wallet routes
//                           and chamas; investor access is REQUESTED via a
//                           popup inside the member dashboard, never a link.
// ─────────────────────────────────────────────────────────────────────────────

export type AppRole = "mlinzi" | "agent" | "investor" | "member";

/** Resolve the single effective role for a user. Order matters. */
export function roleOf(u: User): AppRole {
  if (u.role === "mlinzi") return "mlinzi";
  if (u.isAgent || u.role === "agent") return "agent";
  if (
    u.accessStatus === "accepted" &&
    u.ffVerified === true &&
    (u.relationship === "family" || u.relationship === "friend" || u.relationship === "investor")
  ) return "investor";
  return "member";
}

/** Route prefixes each role is allowed to visit inside the (app) shell. */
const ROUTE_ACCESS: Record<AppRole, string[]> = {
  mlinzi:   ["/mlinzi", "/settings"],
  agent:    ["/agent", "/settings"],
  investor: ["/invest", "/settings"],
  member:   [
    "/dashboard", "/deposit", "/withdraw", "/send", "/history",
    "/savings", "/chama", "/settings",
  ],
};

export function canAccess(role: AppRole, path: string): boolean {
  return ROUTE_ACCESS[role].some((p) => path === p || path.startsWith(p + "/"));
}

/** Derive the canonical home dashboard path for a given user. */
export function homePath(u: User): string {
  switch (roleOf(u)) {
    case "mlinzi":   return "/mlinzi";
    case "agent":    return "/agent";
    case "investor": return "/invest";
    default:         return "/dashboard";
  }
}

/**
 * Guards a page or layout by user role.
 * Returns `true` once the check passes — render `null` until then.
 * Redirects to the user's OWN home dashboard if the check fails, so nobody
 * ever lands on a dashboard that isn't theirs.
 *
 * Usage:
 *   const allowed = useRoleGate((u) => roleOf(u) === "agent");
 *   if (!allowed) return null;
 */
export function useRoleGate(check: (u: User) => boolean): boolean {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    getUser().then((u) => {
      if (!check(u)) router.replace(homePath(u));
      else setOk(true);
    });
  // router is stable; check is an inline function — intentionally omitted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ok;
}

/**
 * App-wide guard: verifies the CURRENT pathname is allowed for the signed-in
 * user's role and redirects home otherwise. Used by the (app) layout so every
 * route is covered without per-page wiring.
 */
export function useRouteGuard(): { ready: boolean; user: User | null } {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    getUser().then((u) => {
      if (cancelled) return;
      setUser(u);
      if (!canAccess(roleOf(u), pathname)) {
        router.replace(homePath(u));
      } else {
        setReady(true);
      }
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return { ready, user };
}
