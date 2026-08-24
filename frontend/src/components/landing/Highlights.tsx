"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { KENYA_COUNTIES, KENYA_VIEWBOX } from "@/lib/kenya-counties";
import { useReveal } from "@/components/ui/useReveal";

import QuickProductModal from "./QuickProductModal";

/* ══════════════════════════════════════════════════════════════════════════
   LIGHTNING — "The Spark": animated bolt + transmitting address
   ══════════════════════════════════════════════════════════════════════════ */

import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const ADDR = "wanjiku@yebobank.com";

export function Lightning() {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  /* ── GSAP ScrollTrigger Multi-Layer Parallax ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // 1. Background Layer Parallax (Depth: -100px, Speed: 0.2x)
      gsap.to(".parallax-bg-layer", {
        yPercent: -15,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });

      // 2. Midground Layer Parallax (Depth: 0px, Speed: 0.8x)
      gsap.to(".parallax-mid-layer", {
        yPercent: -8,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });

      // 3. Foreground Botanical Layer Parallax (Depth: 120px, Speed: 1.4x)
      gsap.to(".parallax-fg-layer", {
        yPercent: -24,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });

      // 4. Subtle Card Entrance
      gsap.fromTo(
        ".parallax-main-card",
        { opacity: 0.9, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".parallax-main-card",
            start: "top 78%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  function copy() {
    if (navigator.clipboard) navigator.clipboard.writeText(ADDR);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <section
      className="sec travertine-parallax-sec"
      id="lightning"
      ref={sectionRef}
    >
      {/* Background Layer (Depth: -100px, Speed: 0.2x): Travertine Texture & Ambient Warmth */}
      <div className="parallax-bg-layer" aria-hidden="true">
        <div className="travertine-texture-grid" />
        <div className="travertine-ambient-glow" />
      </div>

      <div className="wrap travertine-parallax-wrap">
        <div className="travertine-stage-grid">
          {/* Foreground Inset (Depth: 120px, Speed: 1.4x): Zen Stones & Botanical Branch */}
          <div className="parallax-fg-layer travertine-fg-frame">
            <div className="zen-botanical-card">
              <div className="zen-image-wrap">
                <Image
                  src="/images/zen_stones_botanical.jpg"
                  alt="Stacked zen stones with botanical branch on travertine limestone"
                  width={340}
                  height={450}
                  className="zen-img"
                  priority={false}
                />
              </div>
            </div>
          </div>

          {/* Midground Layer (Depth: 0px, Speed: 0.8x): Clean, Uncrowded Frosted Marble Panel */}
          <div className="parallax-mid-layer travertine-mid-frame">
            <div className="parallax-main-card frosted-marble-card">
              <div className="marble-card-header">
                <h2 className="h2">
                  Send.<br />
                  <span className="gold-accent">No border delays or fees.</span>
                </h2>
                <p className="lead">
                  Pay anyone worldwide in seconds with an email-like Lightning address.
                </p>
              </div>

              {/* Clean Minimalist Address Plate */}
              <div className="travertine-addr-plate">
                <div className="addr-meta-label">Lightning Address</div>
                <div className="addr-flex-row">
                  <span className="addr-code">{ADDR}</span>
                  <button
                    type="button"
                    className="addr-copy-pill"
                    onClick={copy}
                    aria-label="Copy Lightning address"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Action Buttons: Golden Amber Send + Ghost Receive */}
              <div className="marble-actions-row">
                <Button variant="gold" onClick={() => setQuickOpen(true)}>
                  Send
                </Button>
                <Button variant="ghost" onClick={() => router.push("/login?redirect=/send")}>
                  Receive
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <QuickProductModal
        isOpen={quickOpen}
        onClose={() => setQuickOpen(false)}
        initialProduct="lightning"
      />
    </section>
  );
}


/* ══════════════════════════════════════════════════════════════════════════
   TRUST — "The Ledger": blockchain-style append-only block list
   ══════════════════════════════════════════════════════════════════════════ */

const BLOCKS = [
  {
    icon: "ti-list-check",
    h: "Append-only ledger",
    p: "Every movement is timestamped and permanent. Nothing is quietly edited or deleted — ever.",
    hash: "0x4a2f...c8d1",
  },
  {
    icon: "ti-brand-open-source",
    h: "Fully open source",
    p: "Read every line of the code that holds your money on GitHub. No black boxes, no surprises.",
    hash: "0x9e1b...3f7a",
  },
  {
    icon: "ti-shield-lock",
    h: "Real security",
    p: "Strong password hashing, a separate transaction PIN, and HTTPS on every request.",
    hash: "0x7c3d...b2e9",
  },
  {
    icon: "ti-building-bank",
    h: "Regulator-ready",
    p: "Pursuing the Central Bank of Kenya sandbox pathway — playing by the rules, on purpose.",
    hash: "0x2a8e...5c4f",
  },
] as const;

export function Trust() {
  const router        = useRouter();
  const chainRef      = useRef<HTMLDivElement>(null);
  const ghostBoltRef  = useReveal<HTMLDivElement>(0.08);

  useEffect(() => {
    const el = chainRef.current;
    if (!el) return;
    const blocks = el.querySelectorAll<HTMLElement>(".ledger-block");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const b  = en.target as HTMLElement;
        const idx = Array.from(blocks).indexOf(b);
        setTimeout(() => b.classList.add("in"), idx * 120);
        io.unobserve(b);
      });
    }, { threshold: 0.15 });
    blocks.forEach(b => io.observe(b));
    return () => io.disconnect();
  }, []);

  return (
    <section className="sec" id="trust" style={{ position: "relative" }}>
      {/* Ghost bolt — echoes the Lightning section's bolt as this section enters */}
      <div className="ghost-echo-wrap ghost-echo-wrap--bolt" aria-hidden="true">
        <div className="ghost-bolt ghost-reveal" ref={ghostBoltRef}>
          <svg viewBox="0 0 120 200" role="presentation" aria-hidden="true">
            <path
              d="M72 8L20 108H62L48 192L100 84H58L72 8Z"
              fill="rgba(224,168,0,.09)"
              stroke="rgba(224,168,0,.22)"
              strokeWidth="1"
            />
          </svg>
        </div>
      </div>

      <div className="wrap" style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <h2 className="h2 reveal d1" style={{ margin: "14px auto 0" }}>
          Every satoshi, <span className="accent">on the record.</span>
        </h2>
        <p className="lead reveal d2" style={{ margin: "20px auto 0" }}>
          We&apos;re custodial by design — so opening an account takes only a
          phone number — but everything we do is auditable and open.
        </p>

        <div className="trust-chain" ref={chainRef}>
          {BLOCKS.map((b, i) => (
            <div key={i}>
              <div
                className="ledger-block reveal"
                style={{ transitionDelay: `${i * 0.1}s`, textAlign: "left" }}
              >
                <div className="ledger-block-icon">
                  <i className={`ti ${b.icon}`} />
                </div>
                <div className="ledger-block-body">
                  <h3>{b.h}</h3>
                  <p>{b.p}</p>
                </div>
                <div>
                  <div className="ledger-block-hash">{b.hash}</div>
                  <div className="ledger-confirm">
                    <i className="ti ti-circle-check" /> verified
                  </div>
                </div>
              </div>
              {i < BLOCKS.length - 1 && <div className="ledger-connector" aria-hidden="true" />}
            </div>
          ))}
        </div>

        <div className="reveal d3" style={{ display: "flex", justifyContent: "center", marginTop: 48 }}>
          <Button variant="primary" onClick={() => router.push("/login?redirect=/dashboard")}>
            Join
          </Button>
        </div>

      </div>
    </section>
  );
}

function SplitLi({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="split-li">
      <i className={`ti ${icon}`} />
      <div>
        <div className="ti-tt">{title}</div>
        <div className="ti-dd">{desc}</div>
      </div>
    </div>
  );
}
