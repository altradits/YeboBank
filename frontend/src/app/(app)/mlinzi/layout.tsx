"use client";
import { useRoleGate, roleOf } from "@/lib/useRoleGate";

// Defense in depth: RouteGuard already blocks non-Mlinzi users, but this
// layout re-verifies so the Mlinzi console can never render for anyone else.
export default function MlinziLayout({ children }: { children: React.ReactNode }) {
  const allowed = useRoleGate((u) => roleOf(u) === "mlinzi");
  if (!allowed) return null;
  return <>{children}</>;
}
