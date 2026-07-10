"use client";
import { useRoleGate, roleOf } from "@/lib/useRoleGate";

// Defense in depth: only registered agents may render the agent console.
export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const allowed = useRoleGate((u) => roleOf(u) === "agent");
  if (!allowed) return null;
  return <>{children}</>;
}
