"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import { getChamas } from "@/lib/api";
import type { Chama } from "@/types";

export default function ChamaPage() {
  const rate = useRate();
  const [chamas, setChamas] = useState<Chama[]>([]);

  useEffect(() => { getChamas().then(setChamas); }, []);

  return (
    <>
      <div className="section-head">
        <div>
          <h1 className="page-title">Chamas</h1>
          <p className="page-sub">Save together. See everything.</p>
        </div>
        <Link href="/chama/create"><Button variant="gold"><i className="ti ti-plus" /> New chama</Button></Link>
      </div>

      <div className="stack" style={{ marginTop: 16 }}>
        {chamas.map((c) => (
          <div className="card" key={c.id}>
            <div className="section-head" style={{ marginBottom: 6 }}>
              <h2>{c.name}</h2>
              <span className="badge confirmed">{c.memberCount}/{c.maxMembers} members</span>
            </div>
            <p className="note">{c.description}</p>
            <div className="grid-2" style={{ marginTop: 14 }}>
              <div className="stat"><span className="l">Group balance</span><span className="v">{num(c.balanceSats)} sats</span>
                <span className="note">≈ KES {num(c.balanceSats * rate.kesPerSat)}</span></div>
              <div className="stat"><span className="l">Monthly contribution</span><span className="v">{num(c.contributionSats)} sats</span>
                <span className="note">≈ KES {num(c.contributionSats * rate.kesPerSat)}</span></div>
            </div>
            <Button block style={{ marginTop: 16 }}><i className="ti ti-arrow-down" /> Contribute now</Button>
          </div>
        ))}
      </div>
    </>
  );
}
