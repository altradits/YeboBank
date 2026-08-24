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
