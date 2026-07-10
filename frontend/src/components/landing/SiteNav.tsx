"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import LogoMark from "@/components/ui/LogoMark";

// Navy tints per section — all share the same midnight-navy gradient,
// so the frosted glass picks up whichever tint is active underneath.
const ACCENTS: Record<string, string> = {
  inflation: "rgba(6,10,24,.74)",
  save:      "rgba(5,9,22,.74)",
  mpesa:     "rgba(4,10,26,.74)",
  chama:     "rgba(8,12,28,.74)",
  agents:    "rgba(5,11,26,.74)",
  lightning: "rgba(6,8,26,.74)",
  invest:    "rgba(9,12,30,.74)",
  trust:     "rgba(5,10,26,.74)",
  convert:   "rgba(7,11,26,.74)",
  cta:       "rgba(4,8,22,.74)",
};
const DEFAULT_DARK = "rgba(4,7,18,.74)";
const SECTION_IDS = ["inflation","save","mpesa","chama","agents","lightning","invest","trust","convert","cta"];

// Every section on the page has a nav link pointing to it.
const NAV_LINKS: { href: string; label: string; sec: string }[] = [
  { href: "#inflation", label: "Why",    sec: "inflation" },
  { href: "#save",      label: "Save",   sec: "save" },
  { href: "#mpesa",     label: "M-Pesa", sec: "mpesa" },
  { href: "#chama",     label: "Chama",  sec: "chama" },
  { href: "#agents",    label: "Agents", sec: "agents" },
  { href: "#lightning", label: "Send",   sec: "lightning" },
  { href: "#invest",    label: "Invest", sec: "invest" },
  { href: "#trust",     label: "Trust",  sec: "trust" },
  { href: "#convert",   label: "Rates",  sec: "convert" },
];

export default function SiteNav() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [accent, setAccent] = useState(DEFAULT_DARK);
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme !== "light");

    const NAV_H = 72;

    function update() {
      const y = window.scrollY;
      setScrolled(y > 48);

      // Walk sections from bottom up; pick the first whose top is at/above nav
      for (const id of [...SECTION_IDS].reverse()) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= NAV_H) {
          setAccent(ACCENTS[id] ?? DEFAULT_DARK);
          return;
        }
      }
      setAccent(DEFAULT_DARK);
    }

    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  function toggleTheme() {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("yebo-theme", next); } catch {}
    setDark(!dark);
  }

  const bg     = scrolled ? accent : "transparent";
  const blur   = scrolled ? "saturate(160%) blur(16px)" : "blur(0px)";
  const border = scrolled ? "rgba(255,255,255,.08)" : "transparent";

  return (
    <nav
      className="nav"
      style={{ "--nav-bg": bg, "--nav-blur": blur, "--nav-border": border } as React.CSSProperties}
    >
      <div className="wrap">
        <Link href="/" className="brand">
          <LogoMark size={34} /> YeboBank
        </Link>
        <div className="navlinks">
          {NAV_LINKS.map(({ href, label, sec }) => (
            <a key={href} href={href} data-sec={sec}>{label}</a>
          ))}
        </div>
        <div className="navactions">
          <button
            className="nav-theme-toggle"
            onClick={toggleTheme}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <i className={`ti ${dark ? "ti-sun" : "ti-moon"}`} />
          </button>
          <Button onClick={() => router.push("/login")}>Sign in</Button>
        </div>
      </div>
    </nav>
  );
}
