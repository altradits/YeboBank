"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import { createChama } from "@/lib/api";
import { ATMCard } from "@/components/app/ATMCard";

export default function CreateChamaPage() {
  const rate = useRate();
  const router = useRouter();
  const [name, setName] = useState("");
  const [contribution, setContribution] = useState("10000");

  const satsNum = parseInt(contribution.replace(/[^0-9]/g, ""), 10) || 0;

  async function onCreate() {
    await createChama(name, satsNum);
    router.push("/chama");
  }

  return (
    <>
      <h1 className="page-title">Create a chama</h1>
      <p className="page-sub">Start a group wallet your members can all see.</p>

      <ATMCard variant="compact" />

      <div className="card" style={{ marginTop: 20 }}>
        <label className="field-group">
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>Chama name</span>
          <input className="input" placeholder="e.g. Mama Mboga Chama"
            value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field-group" style={{ marginTop: 16 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>Monthly contribution (sats)</span>
          <input className="amount-input" inputMode="numeric" value={contribution}
            onChange={(e) => setContribution(e.target.value)} />
        </label>
        <p className="note" style={{ textAlign: "center", marginTop: 10 }}>≈ KES {num(satsNum * rate.kesPerSat, 2)} per member each month</p>
        <Button block variant="gold" style={{ marginTop: 18 }} onClick={onCreate} disabled={!name || !satsNum}>
          <i className="ti ti-users" /> Create chama
        </Button>
      </div>
    </>
  );
}
