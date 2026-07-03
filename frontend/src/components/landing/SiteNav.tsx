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
  save:      "rgba(0,20,8,.72)",
  mpesa:     "rgba(5,8,20,.72)",
  chama:     "rgba(22,12,0,.72)",
  agents:    "rgba(0,18,6,.72)",
  lightning: "rgba(26,14,0,.72)",
  trust:     "rgba(5,18,8,.72)",
  convert:   "rgba(18,10,0,.72)",
  cta:       "rgba(5,10,5,.72)",
};
const DEFAULT_DARK = "rgba(5,12,6,.72)";
const SECTION_IDS = ["inflation","save","mpesa","chama","agents","lightning","trust","convert","cta"];

export default function SiteNav() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [accent, setAccent] = useState(DEFAULT_DARK);

  useEffect(() => {
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
          <a href="#inflation">Inflation</a>
          <a href="#save">Savings</a>
          <a href="#mpesa">M-Pesa</a>
          <a href="#chama">Chamas</a>
          <a href="#agents">Agents</a>
          <a href="#convert">Convert</a>
        </div>
        <div className="navactions">
          <Link className="login" href="/login">Log in</Link>
          <Link className="demo-btn" href="/dashboard">Try demo <i className="ti ti-arrow-right" /></Link>
          <Button onClick={() => router.push("/register")}>Open account</Button>
        </div>
      </div>
    </nav>
  );
}
