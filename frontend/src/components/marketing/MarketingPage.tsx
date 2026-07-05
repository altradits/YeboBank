"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import { useRevealAll } from "@/components/ui/useReveal";
import Button from "@/components/ui/Button";
import LogoMark from "@/components/ui/LogoMark";

/* ── Counter stats (defined outside to avoid stale closure in useEffect) ── */
const STATS = [
  { val: 12400, suf: "+",  label: "Kenyans already saving",          dec: 0 },
  { val: 2.1,   suf: "B",  label: "Sats locked and growing",         dec: 1 },
  { val: 5.2,   suf: "%",  label: "Target APY from treasury yield",  dec: 1 },
  { val: 340,   suf: "+",  label: "Agent locations across Kenya",     dec: 0 },
];

export default function MarketingPage() {
  useRevealAll();
  return (
    <>
      <NavBar />
      <HeroSection />
      <PainSection />
      <ServicesSection />
      <HowItWorksSection />
      <NumbersSection />
      <LightningSection />
      <FinalCTA />
      <SiteFooter />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   1. NAV — transparent on hero, solidifies on scroll
   ══════════════════════════════════════════════════════════════════════════ */
function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handle, { passive: true });
    handle();
    return () => window.removeEventListener("scroll", handle);
  }, []);

  return (
    <nav className={`mkt-nav${scrolled ? " scrolled" : ""}`} aria-label="Main navigation">
      <div className="mkt-nav-inner">
        <Link href="/" className="mkt-brand">
          <LogoMark size={34} /> YeboBank
        </Link>
        <div className="mkt-links">
          <a href="#save">Savings</a>
          <a href="#services">Services</a>
          <a href="#how">How it works</a>
          <a href="#convert">Convert</a>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link
            href="/login"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, color: "rgba(255,255,255,.76)" }}
          >
            Log in
          </Link>
          <button className="mkt-nav-cta" onClick={() => router.push("/login")}>
            Open account
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   2. HERO — 100dvh dark gradient, ambient orbs, animated bar comparison
   ══════════════════════════════════════════════════════════════════════════ */
function HeroSection() {
  const router = useRouter();
  const rate = useRate();

  return (
    <section className="mkt-hero">
      <div className="mkt-hero-inner">
        {/* Copy */}
        <div className="mkt-hero-copy">
          <div className="mkt-hero-eyebrow">Open-source · Built for Kenya</div>
          <h1 className="mkt-hero-h1">
            Save in <span className="h-gold">Bitcoin.</span>
            <br />
            Spend in <span className="h-green">shillings.</span>
          </h1>
          <p className="mkt-hero-sub">
            Your money stops shrinking to inflation. Earn interest in sats, top
            up and cash out with M-Pesa — the open-source bank built for the
            hard-working many.
          </p>
          <button className="mkt-hero-cta" onClick={() => router.push("/login")}>
            Open your account free
          </button>
          <div className="mkt-hero-rate">
            <span className="pulse" />
            1 BTC = KES {num(rate.btcKes)} · {rate.satsPerKes.toFixed(1)} sats per shilling
          </div>
        </div>

        {/* Animated comparison: KES shrinks vs Sats grow */}
        <div className="mkt-hero-visual" aria-hidden="true">
          <div className="mkt-stack">
            <div className="mkt-stack-label">KES in M-Pesa</div>
            <div className="mkt-stack-bars">
              <div className="mkt-bar shrink" />
            </div>
            <div className="mkt-stack-trend down">
              <i className="ti ti-trending-down" /> −7% / yr
            </div>
          </div>
          <div className="mkt-stack-divider" />
          <div className="mkt-stack">
            <div className="mkt-stack-label">Sats in YeboBank</div>
            <div className="mkt-stack-bars">
              <div className="mkt-bar grow" />
            </div>
            <div className="mkt-stack-trend up">
              <i className="ti ti-trending-up" /> +5.2% / yr
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   3. PAIN — parallax dot grid, centered layout, big −7% stat
   ══════════════════════════════════════════════════════════════════════════ */
function PainSection() {
  const bgRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const bg = bgRef.current;
    if (!bg || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const section = bg.parentElement;
        if (!section) return;
        const rect = section.getBoundingClientRect();
        bg.style.transform = `translateY(${rect.top * 0.35}px)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section className="mkt-pain">
      <div className="mkt-pain-bg" ref={bgRef} />
      <div className="mkt-pain-inner">
        <div className="kicker reveal" style={{ justifyContent: "center" }}>
          <i className="ti ti-flame" /> The problem
        </div>
        <div className="mkt-pain-stat reveal d1">−7%</div>
        <p className="lead reveal d2" style={{ margin: "14px auto 0", maxWidth: "44ch" }}>
          Money sitting in mobile money loses 7% of its value to inflation
          every year. Park the same amount in YeboBank and it earns interest
          in Bitcoin — designed to hold value across decades, not melt away.
        </p>
        <div className="reveal d3" style={{ marginTop: 28 }}>
          <Button variant="gold" onClick={() => router.push("/login")}>
            Protect my savings
          </Button>
        </div>
        <div className="bars reveal d4">
          <div className="bar-col">
            <div className="bar bar-shrink" />
            <div className="bar-label"><b>KES in M-Pesa</b>−7% a year</div>
          </div>
          <div className="bar-col">
            <div className="bar bar-grow" />
            <div className="bar-label"><b>Sats in YeboBank</b>earning + holding value</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   4. SERVICES — asymmetric: one wide featured card + three sub-cards
   ══════════════════════════════════════════════════════════════════════════ */
function ServicesSection() {
  const router = useRouter();

  const subCards = [
    {
      id: "mpesa",
      icon: "ti-device-mobile",
      cls: "green",
      title: "M-Pesa · Deposit & withdraw",
      desc: "STK Push in, M-Pesa out. The payment habit 51M Kenyans already have — nothing new to learn.",
      features: ["Deposit via STK Push in seconds", "Cash out straight to your M-Pesa line", "Agents for cash-in / cash-out"],
      cta: "Deposit via M-Pesa",
      href: "/register?redirect=/deposit",
    },
    {
      id: "chama",
      icon: "ti-users",
      cls: "gold",
      title: "Chama · Group savings",
      desc: "Shared wallet, transparent ledger every member can read. The tradition you trust — now it can't be raided.",
      features: ["Open books: all contributions visible", "Group vote required before any payout", "Every transaction recorded permanently"],
      cta: "Start or join a chama",
      href: "/register?redirect=/chama",
    },
    {
      id: "agents",
      icon: "ti-cash",
      cls: "terra",
      title: "Agents · Cash access",
      desc: "No smartphone? Walk to a local agent — a shop you already know — to turn cash into savings and back.",
      features: ["Mawakala across Kenya's neighbourhoods", "No internet bundles required", "Agents earn commission; community benefits"],
      cta: "Find an agent",
      href: "/register?redirect=/agent",
    },
  ];

  return (
    <section className="mkt-services" id="services">
      <div className="mkt-services-inner">
        <div className="reveal" style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 48px" }}>
          <div className="kicker" style={{ justifyContent: "center" }}>
            <i className="ti ti-grid-dots" /> What we offer
          </div>
          <h2 className="h2" style={{ margin: "14px auto 0" }}>
            Everything you need,{" "}
            <span className="grow">nothing you don&apos;t.</span>
          </h2>
        </div>

        {/* Featured: Savings — takes full width above the sub-grid */}
        <div className="mkt-svc-featured reveal" id="save">
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="mkt-svc-featured-badge">
              <i className="ti ti-coin" /> Core product
            </div>
            <h2>Your money earns <span className="acc">while you sleep.</span></h2>
            <p className="desc">
              Lock your sats and earn a share of real treasury returns,
              distributed transparently every month. We take a flat 2% of
              the yield — nothing else. If the pool earns nothing, we earn
              nothing.
            </p>
            <ul className="feats">
              <li><i className="ti ti-lock" /> Lock sats for 5, 7, or 10 years — leave early if you must</li>
              <li><i className="ti ti-scale" /> Honest by design: principal never touched for fees</li>
              <li><i className="ti ti-sparkles" /> Target ~5.2% APY from real treasury yield</li>
            </ul>
            <Button variant="gold" onClick={() => router.push("/login?redirect=/dashboard")}>
              Start saving today
            </Button>
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="balance flat" style={{ border: "1px solid rgba(255,255,255,.16)" }}>
              <div className="head">
                <span className="lbl">Locked savings · 5-year</span>
                <span className="badge"><i className="ti ti-sparkles" /> ~5.2% APY</span>
              </div>
              <div className="amt mn">52,000 sats</div>
              <div className="conv">earned this year</div>
              <div className="qa one">
                <div className="q">
                  <i className="ti ti-info-circle" /> Interest paid from real treasury
                  yield — never from other savers&apos; deposits.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-grid: M-Pesa · Chama · Agents */}
        <div className="mkt-svc-sub-grid">
          {subCards.map((c, i) => (
            <div key={c.id} id={c.id} className={`svc-card reveal${i ? " d" + i : ""}`}>
              <div className={`svc-icon ${c.cls}`}><i className={`ti ${c.icon}`} /></div>
              <h3>{c.title}</h3>
              <p className="svc-desc">{c.desc}</p>
              <ul className="svc-features">
                {c.features.map((f) => (
                  <li key={f}><i className="ti ti-check" />{f}</li>
                ))}
              </ul>
              <button className="svc-link" onClick={() => router.push(c.href)}>
                {c.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   5. HOW IT WORKS — forest green bg, staggered IntersectionObserver reveals
   ══════════════════════════════════════════════════════════════════════════ */
function HowItWorksSection() {
  const router = useRouter();
  const stepsRef = useRef<HTMLDivElement>(null);

  const steps = [
    { n: "01", icon: "ti-phone",          title: "Open with a phone number", desc: "No documents required to start. A phone number, a name, and a secure PIN — you're in." },
    { n: "02", icon: "ti-device-mobile",  title: "Top up via M-Pesa",        desc: "Send shillings from your M-Pesa line. They convert to sats at the live market rate instantly." },
    { n: "03", icon: "ti-lock",           title: "Lock and start earning",    desc: "Choose a savings term. Your sats lock and begin earning a share of real treasury yield each month." },
    { n: "04", icon: "ti-arrow-up",       title: "Cash out anytime",         desc: "When you're ready, withdraw back to M-Pesa in shillings. Your principal always comes back in full." },
  ];

  useEffect(() => {
    const container = stepsRef.current;
    if (!container) return;
    const els = Array.from(container.querySelectorAll<HTMLElement>(".mkt-step"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target as HTMLElement;
        const idx = els.indexOf(el);
        setTimeout(() => el.classList.add("vis"), idx * 130);
        io.unobserve(el);
      });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section className="mkt-how" id="how">
      <div className="mkt-how-inner">
        <div>
          <div className="kicker"><i className="ti ti-route" /> How it works</div>
          <h2 className="h2" style={{ marginTop: 14, color: "#fff" }}>
            From shillings to sats<br />
            <span style={{ color: "var(--gold-soft)" }}>in four steps.</span>
          </h2>
        </div>
        <div className="mkt-how-steps" ref={stepsRef}>
          {steps.map((s) => (
            <div key={s.n} className="mkt-step">
              <span className="mkt-step-n">{s.n}</span>
              <i className={`ti ${s.icon} mkt-step-icon`} />
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 52, display: "flex", justifyContent: "center" }}>
          <Button variant="gold" onClick={() => router.push("/login")}>
            Get started — it&apos;s free
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   6. NUMBERS — palette break (white bg), animated counters on scroll-in
   ══════════════════════════════════════════════════════════════════════════ */
function NumbersSection() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const vals = Array.from(grid.querySelectorAll<HTMLElement>(".mkt-num-val"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target as HTMLElement;
        const idx = vals.indexOf(el);
        const stat = STATS[idx];
        if (!stat) return;
        animateCounter(el, stat.val, stat.suf, stat.dec);
        io.unobserve(el);
      });
    }, { threshold: 0.4 });
    vals.forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, []);

  return (
    <section className="mkt-numbers">
      <div className="mkt-numbers-inner">
        <div className="kicker reveal" style={{ justifyContent: "center" }}>
          <i className="ti ti-chart-bar" /> By the numbers
        </div>
        <h2 className="h2 reveal d1" style={{ margin: "14px auto 0" }}>
          Trusted by real <span className="grow">savers.</span>
        </h2>
        <div className="mkt-numbers-grid" ref={gridRef}>
          {STATS.map((s, i) => (
            <div key={i} className="mkt-num">
              <div className="mkt-num-val">
                0<span className="suf">{s.suf}</span>
              </div>
              <div className="mkt-num-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   7. LIGHTNING — ink dark bg, centered, Lightning address copy
   ══════════════════════════════════════════════════════════════════════════ */
function LightningSection() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const addr = "wanjiku@yebobank.com";

  function copy() {
    if (navigator.clipboard) navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <section className="sec sec-ink" id="convert">
      <div className="wrap" style={{ textAlign: "center", maxWidth: 760 }}>
        <div className="kicker reveal" style={{ justifyContent: "center" }}>
          <i className="ti ti-bolt bolt-anim" /> Lightning network
        </div>
        <h2 className="h2 reveal d1" style={{ margin: "14px auto 0" }}>
          Send money anywhere, <span className="accent">in seconds.</span>
        </h2>
        <p className="lead reveal d2" style={{ margin: "20px auto 0" }}>
          Receive from anyone in the world at your own Lightning address —
          and send to other YeboBank members instantly, with zero fees.
        </p>
        <div className="reveal d3" style={{ display: "flex", justifyContent: "center" }}>
          <div className="la-chip">
            <i className="ti ti-bolt" style={{ color: "var(--gold)" }} />
            <span className="addr">{addr}</span>
            <button className="cpy" onClick={copy} aria-label="Copy Lightning address">
              <i className={copied ? "ti ti-check" : "ti ti-copy"} />
            </button>
          </div>
        </div>
        <div className="reveal d4" style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
          <Button variant="gold" onClick={() => router.push("/login?redirect=/dashboard")}>
            Get your Lightning address
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   8. FINAL CTA — bookend mirrors hero gradient
   ══════════════════════════════════════════════════════════════════════════ */
function FinalCTA() {
  const router = useRouter();
  return (
    <section className="mkt-cta-final">
      <div className="mkt-cta-final-inner reveal">
        <div
          className="kicker"
          style={{ justifyContent: "center", marginBottom: 18, color: "var(--lime)" }}
        >
          <i className="ti ti-heart-handshake" /> Harambee — let&apos;s pull together
        </div>
        <h2>
          Start protecting your<br />
          savings <span className="acc">today.</span>
        </h2>
        <p>
          Open a free account with just a phone number. No paperwork,
          no waiting — your money starts working immediately.
        </p>
        <button className="mkt-hero-cta" onClick={() => router.push("/login")}>
          Open your account free
        </button>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   9. FOOTER
   ══════════════════════════════════════════════════════════════════════════ */
function SiteFooter() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="top">
          <div>
            <div className="brand" style={{ color: "#fff" }}>
              <LogoMark size={34} /> YeboBank
            </div>
            <p style={{ maxWidth: "30ch", marginTop: 14, fontSize: 14 }}>
              An open-source Bitcoin savings bank built for the hard-working
              many. Karibu.
            </p>
          </div>
          <div className="cols">
            <div className="col">
              <h4>Product</h4>
              <a href="#save">Savings</a>
              <a href="#mpesa">M-Pesa</a>
              <a href="#chama">Chamas</a>
              <a href="#agents">Agents</a>
              <a href="#convert">Lightning</a>
            </div>
            <div className="col">
              <h4>Company</h4>
              <a href="/">About</a>
              <a
                href="https://github.com/altradits/YeboBank"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open source
              </a>
              <a href="/login">Contact</a>
            </div>
            <div className="col">
              <h4>Get started</h4>
              <a href="/login">Open account</a>
              <a href="/login">Log in</a>
              <a href="/login">Become an agent</a>
            </div>
          </div>
        </div>
        <div className="bottom">
          <span>Built for Kenya · Open source · CBK sandbox pathway</span>
          <span>© 2026 YeboBank</span>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Utility — animated counter (counts from 0 to target, respects motion pref)
   ══════════════════════════════════════════════════════════════════════════ */
function animateCounter(el: HTMLElement, target: number, suf: string, dec: number) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.innerHTML = `${target.toFixed(dec)}<span class="suf">${suf}</span>`;
    return;
  }
  let start: number | null = null;
  const dur = 1800;
  const tick = (ts: number) => {
    if (start === null) start = ts;
    const p = Math.min((ts - start) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.innerHTML = `${(target * ease).toFixed(dec)}<span class="suf">${suf}</span>`;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
