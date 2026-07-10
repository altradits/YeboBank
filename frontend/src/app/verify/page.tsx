"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import LogoMark from "@/components/ui/LogoMark";
import { verifyOtp } from "@/lib/api";
import { homePath } from "@/lib/useRoleGate";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "";
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function setDigit(i: number, v: string) {
    const clean = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < 5) refs.current[i + 1]?.focus();
  }

  function onKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await verifyOtp(digits.join("")); // mock — always succeeds
      router.push(redirect || homePath(u));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth">
      <div className="auth-card">
        <Link href="/" className="brand"><LogoMark size={34} /> YeboBank</Link>
        <h1>Enter the code</h1>
        <p className="sub">We sent a 6-digit code to your phone.</p>
        <form onSubmit={onSubmit}>
          <div className="otp">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                className="input"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => onKey(i, e)}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>
          <Button type="submit" block disabled={loading}>
            {loading ? "Verifying…" : "Verify & continue"}
          </Button>
        </form>
        <p className="foot-link">
          Didn&apos;t get it? <Link href={redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : "/register"}>Resend code</Link>
        </p>
      </div>
    </main>
  );
}

// useSearchParams() must sit under a Suspense boundary to statically export.
export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
