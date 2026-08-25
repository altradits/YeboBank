"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import LogoMark from "@/components/ui/LogoMark";
import QuickProductModal from "./QuickProductModal";

export function ClosingCTA() {
  const router = useRouter();
  const [quickOpen, setQuickOpen] = useState(false);

  return (
    <section className="cta" id="cta">

      {/* ── Background layer 1: oversized chevron mark at atmospheric scale ── */}
      <div className="cta-wm" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="ctaWmG" x1="20" y1="11" x2="20" y2="31" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F0CC58" stopOpacity=".22" />
              <stop offset="1" stopColor="#8A5E08" stopOpacity=".04" />
            </linearGradient>
          </defs>
          <path d="M8 31L20 11L32 31" stroke="url(#ctaWmG)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="20" cy="11" r="3" fill="#F0CC58" fillOpacity=".16" />
        </svg>
      </div>

      {/* ── Background layer 2: golden dot grid for texture ── */}
      <div className="cta-dot-bg" aria-hidden="true" />

      <div className="wrap" style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <LogoMark size={68} animated />
        </div>

        <div className="statement-copy-col reveal d1" style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h2 className="statement-h2" style={{ color: "var(--fg)" }}>
            <div className="sh-line" style={{ justifyContent: "center", paddingBottom: "12px" }}>
              <span className="sh-highlight gold" style={{ fontSize: "1.1em" }}>Start.</span>
            </div>
            <div className="sh-line" style={{ justifyContent: "center", flexWrap: "wrap" }}>
              <span className="sh-verb" style={{ 
                color: "var(--fg)", 
                fontSize: "clamp(26px, 4vw, 52px)", 
                whiteSpace: "normal", 
                textAlign: "center", 
                lineHeight: 1.15,
                letterSpacing: "-0.02em"
              }}>
                Your money should work <span style={{ color: "var(--gold-soft)" }}>as hard as you do.</span>
              </span>
            </div>
          </h2>
        </div>

        <p className="lead reveal d2" style={{ maxWidth: 640, margin: "24px auto 0", lineHeight: 1.6, padding: "0 20px" }}>
          <span style={{ color: "var(--fg)", fontWeight: 500, fontSize: "1.05em" }}>Inflation has quietly taxed African savings for decades.</span><br/>
          <span style={{ color: "var(--soft)" }}>Open a free Bitcoin treasury today in under 30 seconds.</span>
        </p>

        <div className="cta-actions reveal d2" style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap", marginTop: 28 }}>
          <Button variant="gold" onClick={() => setQuickOpen(true)}>
            Save
          </Button>
          <Button variant="ghost" onClick={() => router.push("/login?redirect=/dashboard")}>
            Explore
          </Button>
        </div>



      </div>

      <QuickProductModal
        isOpen={quickOpen}
        onClose={() => setQuickOpen(false)}
        initialProduct="savings"
      />
    </section>
  );
}

const SOCIALS = [
  { href: "#", icon: "ti-brand-facebook", label: "Facebook", hoverColor: "#1877f2" },
  { href: "#", icon: "ti-brand-x", label: "Twitter / X", hoverColor: "#1a8cd8" },
  { href: "#", icon: "ti-brand-instagram", label: "Instagram", hoverColor: "#e4405f" },
  { href: "#", icon: "ti-brand-linkedin", label: "LinkedIn", hoverColor: "#0a66c2" },
  { href: "#", icon: "ti-brand-tiktok", label: "TikTok", hoverColor: "#ffffff" },
  { href: "#", icon: "ti-brand-youtube", label: "YouTube", hoverColor: "#ff0000" },
];

export function SiteFooter() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="top">

          {/* Brand + tagline + social icons */}
          <div className="foot-brand">
            <div className="brand" style={{ color: "#fff" }}>
              <LogoMark size={34} /> YeboBank
            </div>
            <p className="foot-tagline">
              An open-source Bitcoin savings bank built for the hard-working many.
              Karibu.
            </p>
            <div className="foot-socials" role="list" aria-label="Social media">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="foot-social-link"
                  title={s.label}
                  style={{ "--social-hover": s.hoverColor } as React.CSSProperties}
                >
                  <i className={`ti ${s.icon}`} />
                </a>
              ))}
            </div>
          </div>

          <div className="cols">
            <div className="col">
              <h4>Explore</h4>
              <a href="#inflation">Why Bitcoin</a>
              <a href="#save">Savings</a>
              <a href="#mpesa">M-Pesa</a>
              <a href="#chama">Chamas</a>
              <a href="#agents">Agents</a>
              <a href="#lightning">Send</a>
              <a href="#convert">Rates</a>
            </div>
            <div className="col">
              <h4>Dashboards</h4>
              <Link href="/login?redirect=/dashboard">Member dashboard</Link>
              <Link href="/login?redirect=/agent">Agent console</Link>
              <Link href="/login?redirect=/mlinzi" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--gold-text)", fontWeight: 600 }}>
                <i className="ti ti-shield" /> Mlinzi
              </Link>
            </div>
            <div className="col">
              <h4>Member tools</h4>
              <Link href="/login?redirect=/savings">Savings locks</Link>
              <Link href="/login?redirect=/deposit">Deposit via M-Pesa</Link>
              <Link href="/login?redirect=/chama">My chamas</Link>
              <Link href="/login?redirect=/send">Send sats</Link>
            </div>
          </div>

        </div>
        <div className="bottom">

          <span>Built for Kenya · Open source · CBK sandbox pathway</span>
          <span>
            © 2026 YeboBank ·{" "}
            <a
              href="https://www.linkedin.com/in/stanmobitech/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "underline", textDecorationColor: "rgba(255,255,255,.25)", textUnderlineOffset: "3px" }}
            >
              Developer
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
