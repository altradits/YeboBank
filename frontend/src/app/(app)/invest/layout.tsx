"use client";
import { useRoleGate, roleOf } from "@/lib/useRoleGate";

// The investor dashboard renders ONLY for verified friends & family of the
// Mlinzi with accepted access. Everyone else is sent to their own dashboard.
// Members request access from a popup inside the member dashboard.
export default function InvestLayout({ children }: { children: React.ReactNode }) {
  const allowed = useRoleGate((u) => roleOf(u) === "investor");
  if (!allowed) return null;
  return <>{children}</>;
}
