"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import LogoMark from "@/components/ui/LogoMark";
import { register } from "@/lib/api";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "";
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(phone, fullName, pin || undefined);
      router.push(redirect ? `/verify?redirect=${encodeURIComponent(redirect)}` : "/verify");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <Link href="/" className="brand"><LogoMark size={34} /> YeboBank</Link>
      <h1>Open your account</h1>
      <p className="sub">Karibu. All you need is a phone number.</p>
      <form onSubmit={onSubmit}>
        <div className="field-group">
          <label htmlFor="name">Full name</label>
          <input id="name" className="input" type="text" placeholder="e.g. Wanjiku Kamau"
            value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="field-group">
          <label htmlFor="phone">Phone number</label>
          <input id="phone" className="input" type="tel" placeholder="07XX XXX XXX"
            value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <div className="field-group">
          <label htmlFor="pin">Transaction PIN (6 digits)</label>
          <input id="pin" className="input" type="password" inputMode="numeric" pattern="[0-9]{6}"
            maxLength={6} placeholder="6 digits" autoComplete="new-password"
            value={pin} onChange={(e) => setPin(e.target.value)} />
        </div>
        <Button type="submit" variant="gold" block disabled={loading}>
          {loading ? "Sending code…" : "Continue"}
        </Button>
      </form>
      <p className="foot-link">
        Already have an account? <Link href={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login"}>Log in</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="auth">
      <Suspense fallback={<div className="auth-card"><p>Loading…</p></div>}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}

