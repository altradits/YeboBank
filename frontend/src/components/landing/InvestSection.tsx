"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

// #invest — Friends & Family investing. One CTA, one destination:
// the Investor dashboard. The steward line serves exactly one user (the
// Mlinzi) and points only at the Mlinzi console.
export default function InvestSection() {
  const router = useRouter();

  return (
    <section className="sec" id="invest" style={{ position: "relative" }}>
      <div className="wrap" style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 56, alignItems: "center" }}>

        <div className="reveal d1">
          <p style={{
            fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600,
            letterSpacing: ".12em", textTransform: "uppercase",
            color: "var(--lime)", marginBottom: 14,
          }}>
            <span className="sec-live-dot" aria-hidden="true" />Friends &amp; family pilot
          </p>
          <h2 className="h2">
            Invested for you, <span className="accent">guarded by the Mlinzi.</span>
          </h2>
          <p className="lead">
            A private circle of verified friends and family whose capital is
            stewarded personally — real assets, monthly statements, compounded
            returns. Access is by acceptance only.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 26 }}>
            <Button variant="gold" onClick={() => router.push("/login?redirect=/invest")}>
              Open the Investor dashboard
            </Button>
          </div>
          <p style={{ marginTop: 18, fontSize: 13, color: "var(--soft)" }}>
            Are you the steward?{" "}
            <a
              href="/login?redirect=/mlinzi"
              style={{ color: "var(--gold-soft)", textDecoration: "underline", textUnderlineOffset: "3px" }}
            >
              Enter the Mlinzi console
            </a>
          </p>
        </div>

        <div className="reveal d2" aria-hidden="true">
          {/* Compounding curve — quiet, futuristic, alive */}
          <div style={{
            border: "1px solid rgba(124,199,242,.18)", borderRadius: 24,
            padding: "28px 26px", background: "rgba(10,18,36,.55)",
            backdropFilter: "blur(8px)",
          }}>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".1em",
              textTransform: "uppercase", color: "rgba(228,235,247,.55)", marginBottom: 18,
            }}>
              Compounded monthly · 2% steward fee on gains only
            </div>
            <svg viewBox="0 0 320 150" width="100%" role="img" aria-label="Compounding growth curve">
              <defs>
                <linearGradient id="inv-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#5EE1FF" stopOpacity=".22" />
                  <stop offset="1" stopColor="#5EE1FF" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[30, 70, 110].map((y) => (
                <line key={y} x1="0" x2="320" y1={y} y2={y} stroke="rgba(228,235,247,.08)" strokeWidth="1" />
              ))}
              <path
                d="M0 138 C 80 132, 150 118, 210 88 S 300 22, 320 10 L 320 150 L 0 150 Z"
                fill="url(#inv-fill)"
              />
              <path
                d="M0 138 C 80 132, 150 118, 210 88 S 300 22, 320 10"
                fill="none" stroke="#5EE1FF" strokeWidth="2.5" strokeLinecap="round"
                strokeDasharray="520" strokeDashoffset="520"
                style={{ animation: "inv-draw 2.4s cubic-bezier(.2,.7,.2,1) forwards" }}
              />
              <circle cx="320" cy="10" r="4" fill="#5EE1FF">
                <animate attributeName="opacity" values="1;.3;1" dur="1.8s" repeatCount="indefinite" />
              </circle>
            </svg>
            <style>{`@keyframes inv-draw { to { stroke-dashoffset: 0 } }
              @media (prefers-reduced-motion: reduce) { #invest path { animation: none !important; stroke-dashoffset: 0 !important } }`}</style>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(228,235,247,.6)" }}>
              <span>Entry</span><span style={{ color: "#9BE8FF" }}>+20% p.a. realized</span>
            </div>
          </div>
        </div>

      </div>
      <style>{`@media (max-width: 900px) { #invest .wrap { grid-template-columns: 1fr !important } }`}</style>
    </section>
  );
}
