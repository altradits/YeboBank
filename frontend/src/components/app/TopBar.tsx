"use client";

import { useEffect, useState } from "react";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import { mockUser } from "@/lib/mock";

export function TopBar() {
  const rate = useRate();
  const initials = mockUser.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("");

  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  function toggleTheme() {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("yebo-theme", next); } catch {}
    setDark(!dark);
  }

  return (
    <div className="topbar">
      <div className="mini-ticker">
        <span className="pulse" /> 1 BTC = KES {num(rate.btcKes)}
      </div>
      <div className="who">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
          title={dark ? "Light mode" : "Dark mode"}
        >
          <i className={`ti ${dark ? "ti-sun" : "ti-moon"}`} />
        </button>
        <span>{mockUser.fullName}</span>
        <span className="avatar">{initials}</span>
      </div>
    </div>
  );
}
