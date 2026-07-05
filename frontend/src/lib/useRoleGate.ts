"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/api";
import type { User } from "@/types";

/**
 * Guards a page or layout by user role.
 * Returns `true` once the check passes — render `null` until then.
 * Redirects to `redirectTo` (default "/dashboard") if the check fails.
 *
 * Usage:
 *   const allowed = useRoleGate((u) => u.isAgent);
 *   if (!allowed) return null;
 */
export function useRoleGate(
  check: (u: User) => boolean,
  redirectTo = "/dashboard",
): boolean {
  const router  = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    getUser().then((u) => {
      if (!check(u)) router.replace(redirectTo);
      else setOk(true);
    });
  // router is stable; check/redirectTo are inline functions — intentionally omitted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ok;
}

/** Derive the canonical home dashboard path for a given user. */
export function homePath(u: User): string {
  if (u.role === "mlinzi")       return "/mlinzi";
  if (u.isAgent)                 return "/agent";
  if (u.accessStatus === "accepted") return "/invest";
  return "/dashboard";
}
