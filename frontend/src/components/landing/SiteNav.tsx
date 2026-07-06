"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import LogoMark from "@/components/ui/LogoMark";

// Subtle warm/cool tints per section — all share the same dark gradient,
// so the frosted glass picks up whichever tint is active underneath.
const ACCENTS: Record<string, string> = {
  inflation: "rgba(28,12,0,.72)",
  save:      "rgba(4,8,22,.72)",
  mpesa:     "rgba(0,20,14,.72)",
  chama:     "rgba(22,10,0,.72)",
  agents:    "rgba(0,14,8,.72)",
  lightning: "rgba(6,4,26,.72)",
  trust:     "rgba(5,18,8,.72)",
  convert:   "rgba(18,10,0,.72)",
  cta:       "rgba(5,10,5,.72)",
};
const DEFAULT_DARK = "rgba(5,12,6,.72)";
const SECTION_IDS = ["inflation","save","mpesa","chama","agents","lightning","trust","convert","cta"];

const NAV_LINKS: { href: string; label: string; sec: string }[] = [
  { href: "#inflation", label: "Why",    sec: "inflation" },
  { href: "#save",      label: "Save",   sec: "save" },
  { href: "#chama",     label: "Chama",  sec: "chama" },
  { href: "#agents",    label: "Agents", sec: "agents" },
  { href: "#lightning", label: "Send",   sec: "lightning" },
  { href: "#trust",     label: "Trust",  sec: "trust" },
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
          <Link href="/login" className="login">Log in</Link>
          <Button onClick={() => router.push("/login")}>Open account</Button>
        </div>
      </div>
    </nav>
  );
}
