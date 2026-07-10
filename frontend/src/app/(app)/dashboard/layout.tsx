"use client";
import { useRoleGate, roleOf } from "@/lib/useRoleGate";

// The member dashboard belongs to plain members only — users who are
// neither an investor, nor the Mlinzi, nor an agent.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const allowed = useRoleGate((u) => roleOf(u) === "member");
  if (!allowed) return null;
  return <>{children}</>;
}
