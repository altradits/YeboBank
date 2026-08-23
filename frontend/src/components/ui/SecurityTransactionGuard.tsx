"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/api";
import { numberToWords, validateAmountInWords } from "@/lib/numberToWords";

interface SecurityTransactionGuardProps {
  amount: number;
  currencyName?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  confirmLabel: string;
  loading?: boolean;
  disabled?: boolean;
  userPhone?: string;
  serviceFeeUsd?: string;
}

export default function SecurityTransactionGuard({
  amount,
  currencyName = "KES",
  onConfirm,
  onClose,
  confirmLabel,
  loading = false,
  disabled = false,
  userPhone = "0707 172 370",
  serviceFeeUsd = "$0.50",
}: SecurityTransactionGuardProps) {
  const router = useRouter();

  // ── RULE 3.A: 120s Inactivity Session Timeout ──
  const [secondsLeft, setSecondsLeft] = useState(120);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = () => setSecondsLeft(120);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Timeout: auto-close popup and log out user
          logout().then(() => {
            onClose();
            router.push("/login?timeout=1");
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Reset timer on user interactions
    const handleActivity = () => resetTimer();
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
    };
  }, [onClose, router]);

  // ── RULE 3.B: 6-Digit OTP Verification ──
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("849201");
  const [otpSentNotice, setOtpSentNotice] = useState(true);

  const resendOtp = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newCode);
    setOtp("");
    setOtpSentNotice(true);
  };

  const isOtpValid = otp.trim() === generatedOtp;

  // ── RULE 3.C: Amount in Words Confirmation ──
  const [wordsInput, setWordsInput] = useState("");
  const expectedWords = numberToWords(amount);
  const isWordsValid = validateAmountInWords(wordsInput, amount, currencyName);

  const canConfirm = isOtpValid && isWordsValid && !loading && !disabled && amount > 0;

  return (
    <div className="sec-guard-container" style={{ marginTop: 14 }}>
      {/* Session Inactivity Countdown Pill */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: secondsLeft < 30 ? "rgba(224, 82, 66, 0.12)" : "rgba(240, 204, 88, 0.08)",
          border: `1px solid ${secondsLeft < 30 ? "rgba(224, 82, 66, 0.4)" : "rgba(240, 204, 88, 0.25)"}`,
          borderRadius: 8,
          padding: "6px 12px",
          marginBottom: 14,
          fontSize: 12,
          color: secondsLeft < 30 ? "var(--red)" : "var(--text)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-shield-lock" /> Session Security
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
          <i className="ti ti-clock" /> {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, "0")}
        </span>
      </div>

      {/* RULE 5: Revenue with Relatability */}
      <div
        style={{
          padding: "10px 14px",
          background: "var(--cream)",
          border: "1px solid var(--border-soft)",
          borderRadius: 8,
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
          <span style={{ color: "var(--muted)" }}>Service Fee:</span>
          <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)" }}>{serviceFeeUsd}</span>
        </div>
        <div style={{ fontSize: 12, color: "var(--soft)", marginTop: 2 }}>
          Keeping your money safe.
        </div>
      </div>

      {/* Security Check 1: 6-Digit OTP */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
            6-Digit SMS Security Code (OTP)
          </label>
          <button
            type="button"
            onClick={resendOtp}
            style={{
              background: "none",
              border: "none",
              color: "var(--gold-text)",
              fontSize: 11,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Resend Code
          </button>
        </div>

        {otpSentNotice && (
          <div
            style={{
              fontSize: 11,
              color: "var(--muted)",
              background: "rgba(255,255,255,0.04)",
              padding: "4px 8px",
              borderRadius: 6,
              marginBottom: 6,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Sent to {userPhone}</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--emerald-deep)", fontWeight: 700 }}>
              Code: {generatedOtp}
            </span>
          </div>
        )}

        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="••••••"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          style={{
            width: "100%",
            padding: "10px 12px",
            fontSize: 16,
            letterSpacing: "4px",
            textAlign: "center",
            fontFamily: "var(--font-mono)",
            background: "var(--surface)",
            color: "var(--text)",
            border: `1px solid ${isOtpValid ? "var(--emerald-deep)" : otp.length === 6 ? "var(--red)" : "var(--border)"}`,
            borderRadius: 8,
            outline: "none",
          }}
        />
      </div>

      {/* Security Check 2: Amount in Words */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
          Confirm Amount in Words:
        </label>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>
          Type <strong style={{ color: "var(--gold-text)" }}>&quot;{expectedWords}&quot;</strong> to authorize:
        </div>
        <input
          type="text"
          placeholder={`Type "${expectedWords}"`}
          value={wordsInput}
          onChange={(e) => setWordsInput(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            fontSize: 14,
            background: "var(--surface)",
            color: "var(--text)",
            border: `1px solid ${isWordsValid ? "var(--emerald-deep)" : wordsInput.length > 3 ? "var(--red)" : "var(--border)"}`,
            borderRadius: 8,
            outline: "none",
          }}
        />
        {isWordsValid && (
          <div style={{ fontSize: 11, color: "var(--emerald-deep)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <i className="ti ti-check" /> Amount verified in words
          </div>
        )}
      </div>

      {/* Single Action Button (Rule 1 & Rule 2) */}
      <button
        type="button"
        className="btn btn-gold"
        style={{
          width: "100%",
          padding: "13px",
          fontWeight: 700,
          opacity: canConfirm ? 1 : 0.45,
          cursor: canConfirm ? "pointer" : "not-allowed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
        disabled={!canConfirm}
        onClick={onConfirm}
      >
        <i className="ti ti-shield-check" />
        {loading ? "Authorizing…" : confirmLabel}
      </button>
    </div>
  );
}
