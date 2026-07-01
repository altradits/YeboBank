"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export function ClosingCTA() {
  const router = useRouter();
  return (
    <section className="cta" id="cta">
      <div className="wrap">
        <div className="sw-lead reveal">Harambee — let&apos;s pull together</div>
        <h2 className="reveal d1">Start your savings <span className="gold">today.</span></h2>
        <div className="cta-actions reveal d2">
          <Button variant="gold" onClick={() => router.push("/register")}>
            Open account <i className="ti ti-arrow-right" />
          </Button>
          <Button variant="ghost" onDark onClick={() => router.push("/login")}>
            Log in
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
              <span className="mk">Y</span> YeboBank
            </div>
            <p style={{ maxWidth: "30ch", marginTop: 14, fontSize: 14 }}>
              An open-source Bitcoin savings bank built for the hard-working many.
              Karibu.
            </p>
          </div>
          <div className="cols">
            <div className="col">
              <h4>Product</h4>
              <a href="#save">Savings</a>
              <a href="#mpesa">M-Pesa</a>
              <a href="#chama">Chamas</a>
              <a href="#agents">Agents</a>
              <a href="#convert">Converter</a>
            </div>
            <div className="col">
              <h4>Company</h4>
              <Link href="/">About</Link>
              <a href="https://github.com/altradits/YeboBank" target="_blank" rel="noopener noreferrer">Open source</a>
              <Link href="/#trust">Security</Link>
              <Link href="/register">Contact us</Link>
            </div>
            <div className="col">
              <h4>Get started</h4>
              <Link href="/register">Open account</Link>
              <Link href="/login">Log in</Link>
              <Link href="/register">Become an agent</Link>
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
