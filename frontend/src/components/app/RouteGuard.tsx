"use client";

import { useRouteGuard } from "@/lib/useRoleGate";

/**
 * Blocks rendering of any (app) route until the signed-in user's role has
 * been verified against the current path. Users who don't belong on a route
 * are silently redirected to their own home dashboard:
 *
 *   Mlinzi   → /mlinzi     Agent → /agent
 *   Investor → /invest     Member → /dashboard
 */
export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { ready } = useRouteGuard();
  if (!ready) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center" }}>
        <p className="note">Checking access…</p>
      </div>
    );
  }
  return <>{children}</>;
}
