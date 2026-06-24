"use client";

import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import { mockUser } from "@/lib/mock";

export function TopBar() {
  const rate = useRate();
  const initials = mockUser.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <div className="topbar">
      <div className="mini-ticker">
        <span className="pulse" /> 1 BTC = KES {num(rate.btcKes)}
      </div>
      <div className="who">
        <span>{mockUser.fullName}</span>
        <span className="avatar">{initials}</span>
      </div>
    </div>
  );
}
