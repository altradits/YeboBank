"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

/* ══════════════════════════════════════════════════════════════════════════
   LIGHTNING — "The Spark": animated bolt + transmitting address
   ══════════════════════════════════════════════════════════════════════════ */

const ADDR = "wanjiku@yebobank.com";

export function Lightning() {
  const router     = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied]           = useState(false);
  const [transmitting, setTransmit]   = useState(false);
  const [visibleChars, setVisible]    = useState(0);
  const rafRef   = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0, active: false });

  /* ── Transmit address animation on hover ── */
  function startTransmit() {
    if (transmitting) return;
    setTransmit(true);
    setVisible(0);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisible(i);
      if (i >= ADDR.length) clearInterval(interval);
    }, 45);
  }

  /* ── Canvas arc particles ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    type Arc = { x1: number; y1: number; x2: number; y2: number; life: number; maxLife: number; color: string };
    const arcs: Arc[] = [];

    const spawnArc = (mx: number, my: number) => {
      const angle  = Math.random() * Math.PI * 2;
      const dist   = 20 + Math.random() * 60;
      arcs.push({
        x1: mx, y1: my,
        x2: mx + Math.cos(angle) * dist,
        y2: my + Math.sin(angle) * dist,
        life: 0,
        maxLife: 10 + Math.random() * 12,
        color: Math.random() > 0.5 ? "rgba(224,168,0," : "rgba(150,194,68,",
      });
    };

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (mouseRef.current.active && frame % 3 === 0) {
        spawnArc(mouseRef.current.x, mouseRef.current.y);
      }

      for (let i = arcs.length - 1; i >= 0; i--) {
        const a = arcs[i];
        a.life++;
        const progress = a.life / a.maxLife;
        const opacity  = Math.sin(progress * Math.PI) * 0.7;
        ctx.beginPath();
        ctx.moveTo(a.x1, a.y1);
        // Jagged midpoint for electric look
        const mx = (a.x1 + a.x2) / 2 + (Math.random() - 0.5) * 20;
        const my = (a.y1 + a.y2) / 2 + (Math.random() - 0.5) * 20;
        ctx.quadraticCurveTo(mx, my, a.x2, a.y2);
        ctx.strokeStyle = `${a.color}${opacity.toFixed(2)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        if (a.life >= a.maxLife) arcs.splice(i, 1);
      }

      frame++;
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    const sec = sectionRef.current;
    if (sec) {
      const onMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        mouseRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          active: true,
        };
      };
      const onLeave = () => { mouseRef.current.active = false; };
      sec.addEventListener("mousemove", onMove);
      sec.addEventListener("mouseleave", onLeave);
      return () => {
        window.removeEventListener("resize", resize);
        cancelAnimationFrame(rafRef.current);
        sec.removeEventListener("mousemove", onMove);
        sec.removeEventListener("mouseleave", onLeave);
      };
    }

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function copy() {
    if (navigator.clipboard) navigator.clipboard.writeText(ADDR);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <section className="sec" id="lightning" ref={sectionRef} style={{ position: "relative" }}>
      {/* Canvas for mouse arc particles */}
      <canvas
        ref={canvasRef}
        className="arc-canvas"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }}
        aria-hidden="true"
      />

      <div className="wrap" style={{ position: "relative", zIndex: 2 }}>
        <div className="lightning-layout">

          {/* LEFT — animated bolt + stats, clean stack layout */}
          <div className="bolt-visual reveal">
            {/* Speed stats row */}
            <div className="bolt-stats-row">
              <div className="bolt-stat">
                <div className="bolt-stat-n">0¢</div>
                <div className="bolt-stat-l">send fee</div>
              </div>
              <div className="bolt-stat" style={{ textAlign: "right" }}>
                <div className="bolt-stat-n">&lt;1s</div>
                <div className="bolt-stat-l">settlement</div>
              </div>
            </div>

            {/* Bolt SVG */}
            <div className="bolt-svg-wrap">
              <svg className="bolt-svg" width="120" height="200" viewBox="0 0 120 200" fill="none">
                <path
                  d="M72 8L20 108H62L48 192L100 84H58L72 8Z"
                  fill="url(#bolt-grad)"
                  stroke="rgba(255,255,255,.2)"
                  strokeWidth="1"
                />
                <defs>
                  <linearGradient id="bolt-grad" x1="60" y1="8" x2="60" y2="192" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#E0C040" />
                    <stop offset="0.5" stopColor="#C49020" />
                    <stop offset="1" stopColor="#7A5800" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Global reach stat */}
            <div className="bolt-stat" style={{ textAlign: "center" }}>
              <div className="bolt-stat-n">Global</div>
              <div className="bolt-stat-l">reach — any country</div>
            </div>

            {/* Transmitting address — appears char-by-char on hover */}
            <div className="transmit-wrap">
              <div
                className="transmit-chip"
                onMouseEnter={startTransmit}
                onMouseLeave={() => setTransmit(false)}
              >
                <span className="transmit-addr">
                  {transmitting
                    ? ADDR.split("").map((ch, i) => (
                        <span
                          key={i}
                          className="transmit-char"
                          style={{ animationDelay: `${i * 44}ms`, color: i < visibleChars ? "#fff" : "transparent" }}
                        >
                          {ch}
                        </span>
                      ))
                    : ADDR
                  }
                </span>
                <button className="transmit-cpy" onClick={copy} aria-label="Copy address">
                  <i className={`ti ${copied ? "ti-check" : "ti-copy"}`} />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT — copy */}
          <div className="reveal d1">
            <div className="kicker"><i className="ti ti-bolt bolt-anim" /> Lightning network</div>
            <h2 className="h2">Send money anywhere, <span className="accent">in seconds.</span></h2>
            <p className="lead">
              Your Lightning address works like an email for money. Anyone,
              anywhere in the world can send you sats instantly — and you
              can send within YeboBank for zero fees.
            </p>
            <p style={{ marginTop: 12, fontSize: 13, color: "rgba(255,255,255,.4)", fontStyle: "italic" }}>
              ↖ Move your cursor across the left panel to see the electric sparks.
            </p>
            <div className="split-list">
              <SplitLi icon="ti-bolt"        title="Instant settlement"  desc="Lightning transactions confirm in under a second." />
              <SplitLi icon="ti-world"       title="Global reach"        desc="Send to any Lightning wallet, in any country." />
              <SplitLi icon="ti-coin-off"    title="Zero fees inside"    desc="Free transfers between YeboBank members, always." />
            </div>
            <div style={{ marginTop: 32 }}>
              <Button variant="gold" onClick={() => router.push("/register?redirect=/send")}>
                Get your Lightning address <i className="ti ti-arrow-right" />
              </Button>
            </div>
          </div>

        </div>
      </div>
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
  const router   = useRouter();
  const chainRef = useRef<HTMLDivElement>(null);

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
    <section className="sec" id="trust">
      <div className="wrap" style={{ textAlign: "center" }}>
        <div className="kicker reveal" style={{ justifyContent: "center" }}>
          <i className="ti ti-shield-check" /> Trust &amp; transparency
        </div>
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
          <Button variant="gold" onClick={() => router.push("/register")}>
            Open a trusted account <i className="ti ti-arrow-right" />
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
