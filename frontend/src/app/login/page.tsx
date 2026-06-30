"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "";
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(phone, password); // mock — always succeeds for now
      router.push(redirect || "/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth">
      <div className="auth-card">
        <Link href="/" className="brand"><span className="mk">Y</span> YeboBank</Link>
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
      </div>
    </main>
  );
}
