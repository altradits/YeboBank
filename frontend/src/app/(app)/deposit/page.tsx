"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import { depositMpesa, depositLightning } from "@/lib/api";
import { ATMCard } from "@/components/app/ATMCard";

export default function DepositPage() {
  const rate = useRate();
  const [tab, setTab] = useState<"mpesa" | "lightning">("mpesa");
  const [kes, setKes] = useState("500");
  const [status, setStatus] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<string | null>(null);

  const kesNum = parseFloat(kes.replace(/[^0-9.]/g, "")) || 0;
  const sats = Math.round(kesNum * rate.satsPerKes);

  async function onMpesa() {
    setStatus("Sending STK Push to your phone…");
    await depositMpesa(kesNum);
    setStatus("Prompt sent. Enter your M-Pesa PIN on your phone to confirm.");
  }
  async function onLightning() {
    const res = await depositLightning(sats);
    setInvoice(res.invoice);
  }

  return (
    <>
      <h1 className="page-title">Add money</h1>
      <p className="page-sub">Top up your savings in shillings or over Lightning.</p>

      <ATMCard variant="full" balanceLabel="BALANCE BEFORE DEPOSIT" />

      <div className="seg" style={{ marginTop: 20 }}>
        <button className={tab === "mpesa" ? "on" : ""} onClick={() => setTab("mpesa")}>M-Pesa</button>
        <button className={tab === "lightning" ? "on" : ""} onClick={() => setTab("lightning")}>Lightning</button>
      </div>

      {tab === "mpesa" ? (
        <div className="card" style={{ marginTop: 18 }}>
          <label className="field-group">
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>Amount in KES</span>
            <input className="amount-input" inputMode="decimal" value={kes}
              onChange={(e) => setKes(e.target.value)} />
          </label>
          <p className="note" style={{ textAlign: "center", marginTop: 12 }}>
            You&apos;ll receive <b>≈ {num(sats)} sats</b> at the live rate.
          </p>
          <Button block style={{ marginTop: 18 }} onClick={onMpesa}>
            <i className="ti ti-device-mobile" /> Send STK Push
          </Button>
          {status && <p className="note" style={{ marginTop: 14, textAlign: "center", color: "var(--emerald-deep)" }}>{status}</p>}
        </div>
      ) : (
        <div className="card" style={{ marginTop: 18, textAlign: "center" }}>
          {invoice ? (
            <>
              <div className="qr" />
              <p className="note" style={{ marginTop: 16 }}>Scan to pay {num(sats)} sats. Your balance updates the moment it settles.</p>
              <p className="mn" style={{ fontSize: 12, color: "var(--soft)", marginTop: 10, wordBreak: "break-all" }}>{invoice}</p>
            </>
          ) : (
            <>
              <label className="field-group" style={{ textAlign: "left" }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>Amount in KES</span>
                <input className="amount-input" inputMode="decimal" value={kes}
                  onChange={(e) => setKes(e.target.value)} />
              </label>
              <p className="note" style={{ marginTop: 12 }}>Generate a Lightning invoice for ≈ {num(sats)} sats.</p>
              <Button block style={{ marginTop: 18 }} onClick={onLightning}>
                <i className="ti ti-bolt" /> Generate invoice
              </Button>
            </>
          )}
        </div>
      )}
    </>
  );
}
