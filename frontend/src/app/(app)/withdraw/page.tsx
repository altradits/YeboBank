"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import { withdrawMpesa } from "@/lib/api";
import { ATMCard } from "@/components/app/ATMCard";

export default function WithdrawPage() {
  const rate = useRate();
  const [kes, setKes] = useState("1000");
  const [done, setDone] = useState(false);

  const kesNum = parseFloat(kes.replace(/[^0-9.]/g, "")) || 0;
  const sats = Math.round(kesNum * rate.satsPerKes);

  async function onWithdraw() {
    await withdrawMpesa(sats);
    setDone(true);
  }

  return (
    <>
      <h1 className="page-title">Withdraw to M-Pesa</h1>
      <p className="page-sub">Send shillings straight back to your phone.</p>

      <ATMCard variant="full" balanceLabel="BALANCE AVAILABLE TO WITHDRAW" />

      <div className="card" style={{ marginTop: 20 }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <i className="ti ti-circle-check" style={{ fontSize: 48, color: "var(--emerald-deep)" }} />
            <h2 style={{ fontFamily: "var(--font-display)", marginTop: 12 }}>On its way</h2>
            <p className="note" style={{ marginTop: 6 }}>KES {num(kesNum, 2)} is being sent to your M-Pesa line.</p>
          </div>
        ) : (
          <>
            <label className="field-group">
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>Amount in KES</span>
              <input className="amount-input" inputMode="decimal" value={kes}
                onChange={(e) => setKes(e.target.value)} />
            </label>
            <p className="note" style={{ textAlign: "center", marginTop: 12 }}>
              Debits <b>≈ {num(sats)} sats</b> from your balance · requires your transaction PIN.
            </p>
            <Button block style={{ marginTop: 18 }} onClick={onWithdraw}>
              <i className="ti ti-arrow-up" /> Withdraw to M-Pesa
            </Button>
          </>
        )}
      </div>
    </>
  );
}
