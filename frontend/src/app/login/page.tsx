"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import LogoMark from "@/components/ui/LogoMark";
import { login, getUser } from "@/lib/api";
import { homePath } from "@/lib/useRoleGate";


export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "";
  const [phone, setPhone] = useState("+254712345678");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(phone, password); // mock — always succeeds for now
      const u = await getUser();
      router.push(redirect || homePath(u));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth">
      <div className="auth-card">
        <Link href="/" className="brand"><LogoMark size={34} /> YeboBank</Link>
        <h1>Welcome back</h1>
        <p className="sub">Log in to your savings.</p>
        <form onSubmit={onSubmit}>
          <div className="field-group">
            <label htmlFor="phone">Phone number</label>
            <input id="phone" className="input" type="tel" placeholder="07XX XXX XXX"
              value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div className="field-group">
            <label htmlFor="pw">Password</label>
            <input id="pw" className="input" type="password" placeholder="Your password"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" block disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </Button>
        </form>
        <p className="foot-link">
          New to YeboBank? <Link href={redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : "/register"}>Open an account</Link>
        </p>

        {/* Demo accounts — each phone signs into a different role. Every role is
            locked to its own dashboard and its own settings. */}
        <div style={{ marginTop: 22, borderTop: "1px solid var(--border-soft)", paddingTop: 14 }}>
          <p className="note" style={{ marginBottom: 8, fontSize: 12 }}>Demo accounts (any password):</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {([
              ["Member",   "+254712345678"],
              ["Agent",    "+254700000002"],
              ["Investor", "+254700000003"],
              ["Mlinzi",   "+254700000001"],
            ] as const).map(([label, ph]) => (
              <button
                key={label}
                type="button"
                onClick={() => setPhone(ph)}
                style={{
                  padding: "8px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer",
                  border: `1px solid ${phone === ph ? "var(--gold)" : "var(--border-soft)"}`,
                  background: "transparent", color: "var(--text)",
                  fontFamily: "var(--font-display)", fontWeight: 600,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
