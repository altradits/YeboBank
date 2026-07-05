"use client";
import { useRoleGate } from "@/lib/useRoleGate";

export default function MlinziLayout({ children }: { children: React.ReactNode }) {
  const allowed = useRoleGate((u) => u.role === "mlinzi");
  if (!allowed) return null;
  return <>{children}</>;
}
