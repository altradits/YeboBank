"use client";

import { useState } from "react";

export function Lightning() {
  const [copied, setCopied] = useState(false);
  function copy() {
    const addr = "wanjiku@yebobank.com";
    if (navigator.clipboard) navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }
  return (
    <section className="sec sec-ink">
      <div className="wrap" style={{ textAlign: "center", maxWidth: 760 }}>
        <div className="kicker reveal" style={{ justifyContent: "center" }}>
          <i className="ti ti-bolt bolt-anim" /> Lightning network
        </div>
        <h2 className="h2 reveal d1" style={{ margin: "14px auto 0" }}>
          Send money anywhere, <span className="accent">in seconds.</span>
        </h2>
        <p className="lead reveal d2" style={{ margin: "20px auto 0" }}>
          Receive from anyone in the world at your own Lightning address — and send
          to other YeboBank members instantly, with zero fees. Global money, in
          your pocket.
        </p>
        <div className="reveal d3" style={{ display: "flex", justifyContent: "center" }}>
          <div className="la-chip">
            <i className="ti ti-bolt" style={{ color: "var(--gold)" }} />
            <span className="addr">wanjiku@yebobank.com</span>
            <button className="cpy" onClick={copy} aria-label="Copy Lightning address">
              <i className={copied ? "ti ti-check" : "ti ti-copy"} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Trust() {
  const cards = [
    { ic: "ti-list-check", h: "Append-only ledger", p: "Every movement is timestamped and permanent. Nothing is quietly edited or deleted." },
    { ic: "ti-brand-open-source", h: "Fully open source", p: "Read every line of the code that holds your money. No black boxes." },
    { ic: "ti-shield-lock", h: "Real security", p: "Strong password hashing, a separate transaction PIN, and HTTPS everywhere." },
    { ic: "ti-building-bank", h: "Regulator-ready", p: "Pursuing the Central Bank of Kenya sandbox — playing by the rules, on purpose." },
  ];
  return (
    <section className="sec sec-dark">
      <div className="wrap" style={{ textAlign: "center" }}>
        <div className="kicker reveal" style={{ justifyContent: "center" }}>
          <i className="ti ti-shield-check" /> Built to be trusted
        </div>
        <h2 className="h2 reveal d1" style={{ margin: "14px auto 0" }}>
          Every satoshi, <span className="accent">on the record.</span>
        </h2>
        <p className="lead reveal d2" style={{ margin: "20px auto 0" }}>
          We&apos;re custodial by design — so opening an account takes only a phone
          number — but everything we do is auditable and open.
        </p>
        <div className="trust-grid">
          {cards.map((c, i) => (
            <div key={i} className={`tcard reveal${i ? " d" + i : ""}`}>
              <i className={`ti ${c.ic}`} />
              <h3>{c.h}</h3>
              <p>{c.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
