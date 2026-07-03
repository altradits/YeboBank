"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import LogoMark from "@/components/ui/LogoMark";
import { register } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "";
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(phone, fullName); // mock — sends an OTP
      router.push(redirect ? `/verify?redirect=${encodeURIComponent(redirect)}` : "/verify");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth">
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
          <Button type="submit" variant="gold" block disabled={loading}>
            {loading ? "Sending code…" : "Continue"}
          </Button>
        </form>
        <p className="foot-link">
          Already have an account? <Link href={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login"}>Log in</Link>
        </p>
      </div>
    </main>
  );
}
