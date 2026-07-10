"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import LogoMark from "@/components/ui/LogoMark";

export function ClosingCTA() {
  const router = useRouter();
  return (
    <section className="cta" id="cta">

      {/* ── Background layer 1: oversized chevron mark at atmospheric scale ── */}
      <div className="cta-wm" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="ctaWmG" x1="20" y1="11" x2="20" y2="31" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F0CC58" stopOpacity=".22"/>
              <stop offset="1" stopColor="#8A5E08" stopOpacity=".04"/>
            </linearGradient>
          </defs>
          <path d="M8 31L20 11L32 31" stroke="url(#ctaWmG)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <circle cx="20" cy="11" r="3" fill="#F0CC58" fillOpacity=".16"/>
        </svg>
      </div>

      {/* ── Background layer 2: golden dot grid for texture ── */}
      <div className="cta-dot-bg" aria-hidden="true" />

      <div className="wrap">

        <h2 className="reveal d1">
          Your money should work as hard<br />as <span className="gold">you do.</span>
        </h2>

        <p className="cta-lead reveal d2">
          Inflation has quietly taxed Kenyan savings at 6–9% a year for decades.
          We built YeboBank on Bitcoin and open code — the only two things we trust
          to stay honest over time.
        </p>

        <div className="cta-actions reveal d2">
          <Button variant="gold" onClick={() => router.push("/login?redirect=/dashboard")}>
            Open your Member dashboard
          </Button>
        </div>

      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="top">
          <div>
            <div className="brand" style={{ color: "#fff" }}>
              <LogoMark size={34} /> YeboBank
            </div>
            <p style={{ maxWidth: "30ch", marginTop: 14, fontSize: 14 }}>
              An open-source Bitcoin savings bank built for the hard-working many.
              Karibu.
            </p>
          </div>
          <div className="cols">
            {/* Every explore link anchors a section; every section serves ONE dashboard */}
            <div className="col">
              <h4>Explore</h4>
              <a href="#inflation">Why Bitcoin</a>
              <a href="#save">Savings</a>
              <a href="#mpesa">M-Pesa</a>
              <a href="#chama">Chamas</a>
              <a href="#agents">Agents</a>
              <a href="#lightning">Send</a>
              <a href="#invest">Invest</a>
              <a href="#trust">Trust</a>
              <a href="#convert">Rates</a>
            </div>
            {/* Each footer link opens one specific dashboard — no choices inside */}
            <div className="col">
              <h4>Dashboards</h4>
              <Link href="/login?redirect=/dashboard">Member dashboard</Link>
              <Link href="/login?redirect=/agent">Agent console</Link>
              <Link href="/login?redirect=/invest">Investor dashboard</Link>
              <Link href="/login?redirect=/mlinzi">Mlinzi console</Link>
            </div>
            <div className="col">
              <h4>Member tools</h4>
              <Link href="/login?redirect=/savings">Savings locks</Link>
              <Link href="/login?redirect=/deposit">Deposit via M-Pesa</Link>
              <Link href="/login?redirect=/chama">My chamas</Link>
              <Link href="/login?redirect=/send">Send sats</Link>
              <a href="https://github.com/altradits/YeboBank" target="_blank" rel="noopener noreferrer">Open source</a>
            </div>
          </div>
        </div>
        <ul className="social-wrapper" aria-label="Social media">
          <li className="icon facebook">
            <span className="tooltip">Facebook</span>
            <a href="#" aria-label="Facebook"><i className="ti ti-brand-facebook" /></a>
          </li>
          <li className="icon twitter">
            <span className="tooltip">Twitter / X</span>
            <a href="#" aria-label="Twitter"><i className="ti ti-brand-x" /></a>
          </li>
          <li className="icon instagram">
            <span className="tooltip">Instagram</span>
            <a href="#" aria-label="Instagram"><i className="ti ti-brand-instagram" /></a>
          </li>
          <li className="icon linkedin">
            <span className="tooltip">LinkedIn</span>
            <a href="#" aria-label="LinkedIn"><i className="ti ti-brand-linkedin" /></a>
          </li>
          <li className="icon tiktok">
            <span className="tooltip">TikTok</span>
            <a href="#" aria-label="TikTok"><i className="ti ti-brand-tiktok" /></a>
          </li>
          <li className="icon youtube">
            <span className="tooltip">YouTube</span>
            <a href="#" aria-label="YouTube"><i className="ti ti-brand-youtube" /></a>
          </li>
        </ul>
        <div className="bottom">
          <span>Built for Kenya · Open source · CBK sandbox pathway</span>
          <span>© 2026 YeboBank · <a href="https://www.linkedin.com/in/stanmobitech/" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline", textDecorationColor: "rgba(255,255,255,.25)", textUnderlineOffset: "3px" }}>Developer</a></span>
        </div>
      </div>
    </footer>
  );
}
