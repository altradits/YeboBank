"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import { getAllChamas, requestJoinChama } from "@/lib/api";
import type { Chama } from "@/types";

export default function DiscoverPage() {
  const rate = useRate();
  const [chamas, setChamas] = useState<Chama[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    getAllChamas().then((list) => {
      setChamas(list);
      setLoading(false);
    });
  }, []);

  async function handleJoin(chamaId: string) {
    setJoining(chamaId);
    try {
      await requestJoinChama(chamaId);
      setChamas((prev) =>
        prev.map((c) => (c.id === chamaId ? { ...c, pendingJoin: true } : c)),
      );
    } finally {
      setJoining(null);
    }
  }

  return (
    <>
      <div className="section-head">
        <div>
          <h1 className="page-title">Discover chamas</h1>
          <p className="page-sub">Browse all YeboBank groups and request to join.</p>
        </div>
        <Link href="/chama">
          <Button variant="ghost"><i className="ti ti-arrow-left" /> My chamas</Button>
        </Link>
      </div>

      {loading && (
        <p className="note" style={{ marginTop: 24 }}>Loading chamas…</p>
      )}

      <div className="stack" style={{ marginTop: 16 }}>
        {chamas.map((c) => (
          <div className="discover-card" key={c.id}>
            <div className="dc-head">
              <h2>{c.name}</h2>
              <span className="badge confirmed">{c.memberCount}/{c.maxMembers}</span>
            </div>
            <p className="note" style={{ marginBottom: 12 }}>{c.description}</p>

            <div className="grid-2" style={{ marginBottom: 14 }}>
              <div className="stat">
                <span className="l">Group balance</span>
                <span className="v" style={{ fontSize: 18 }}>{num(c.balanceSats)} sats</span>
                <span className="note">≈ KES {num(c.balanceSats * rate.kesPerSat)}</span>
              </div>
              <div className="stat">
                <span className="l">Monthly contribution</span>
                <span className="v" style={{ fontSize: 18 }}>{num(c.contributionSats)} sats</span>
                <span className="note">≈ KES {num(c.contributionSats * rate.kesPerSat)}</span>
              </div>
            </div>

            {c.isMember ? (
              <Link href={`/chama/${c.id}`}>
                <Button variant="ghost" block>
                  <i className="ti ti-door-enter" /> Open
                </Button>
              </Link>
            ) : c.pendingJoin ? (
              <Button variant="ghost" block disabled>
                <i className="ti ti-clock" /> Pending approval
              </Button>
            ) : (
              <Button
                block
                disabled={joining === c.id}
                onClick={() => handleJoin(c.id)}
              >
                {joining === c.id ? (
                  "Sending request…"
                ) : (
                  <><i className="ti ti-user-plus" /> Request to join</>
                )}
              </Button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
