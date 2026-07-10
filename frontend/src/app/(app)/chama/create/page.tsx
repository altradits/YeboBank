"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import { createChama, inviteToChama } from "@/lib/api";
import { ATMCard } from "@/components/app/ATMCard";

export default function CreateChamaPage() {
  const rate = useRate();
  const router = useRouter();

  // Step 1 — details
  const [name, setName] = useState("");
  const [contribution, setContribution] = useState("10000");
  const [creating, setCreating] = useState(false);

  // Step 2 — invite friends (you're the only member until they accept)
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [createdName, setCreatedName] = useState("");
  const [invites, setInvites] = useState<string[]>([""]);
  const [inviting, setInviting] = useState(false);
  const [invitedCount, setInvitedCount] = useState<number | null>(null);

  const satsNum = parseInt(contribution.replace(/[^0-9]/g, ""), 10) || 0;

  async function onCreate() {
    setCreating(true);
    try {
      const chama = await createChama(name, satsNum);
      setCreatedId(chama.id);
      setCreatedName(chama.name);
    } finally {
      setCreating(false);
    }
  }

  function setInvite(i: number, v: string) {
    setInvites((prev) => prev.map((x, idx) => (idx === i ? v : x)));
  }

  async function onInvite() {
    if (!createdId) return;
    const contacts = invites.map((c) => c.trim()).filter(Boolean);
    if (contacts.length === 0) return;
    setInviting(true);
    try {
      const res = await inviteToChama(createdId, contacts);
      setInvitedCount(res.invited);
    } finally {
      setInviting(false);
    }
  }

  // ── Step 2: invite friends ──────────────────────────────────────────────
  if (createdId) {
    return (
      <>
        <h1 className="page-title">{createdName} is live</h1>
        <p className="page-sub">You&apos;re the admin and only member. Invite friends — they join once they accept.</p>

        <div className="card" style={{ marginTop: 20 }}>
          <div className="section-head"><h2>Invite friends</h2></div>
          <p className="note" style={{ marginBottom: 12 }}>
            Enter a phone number or @handle per line. Invitees must accept before
            they can see anything inside the chama.
          </p>

          {invitedCount === null ? (
            <>
              {invites.map((v, i) => (
                <input
                  key={i}
                  className="input"
                  style={{ marginTop: i === 0 ? 0 : 10 }}
                  placeholder="+2547XX XXX XXX or @handle"
                  value={v}
                  onChange={(e) => setInvite(i, e.target.value)}
                />
              ))}
              <button
                className="txtlink"
                style={{ marginTop: 10 }}
                onClick={() => setInvites((p) => [...p, ""])}
              >
                <i className="ti ti-plus" /> Add another
              </button>
              <Button
                block variant="gold" style={{ marginTop: 18 }}
                onClick={onInvite}
                disabled={inviting || invites.every((c) => !c.trim())}
              >
                {inviting ? "Sending invites…" : <><i className="ti ti-send" /> Send invites</>}
              </Button>
            </>
          ) : (
            <p className="note">
              <i className="ti ti-circle-check" style={{ color: "var(--emerald-deep)" }} />{" "}
              {invitedCount} {invitedCount === 1 ? "invite" : "invites"} sent. Friends appear as
              members once they accept.
            </p>
          )}

          <Button
            block variant={invitedCount === null ? "ghost" : "primary"} style={{ marginTop: 12 }}
            onClick={() => router.push(`/chama/${createdId}`)}
          >
            {invitedCount === null ? "Skip for now — open my chama" : "Open my chama"}
          </Button>
        </div>
      </>
    );
  }

  // ── Step 1: details ─────────────────────────────────────────────────────
  return (
    <>
      <div style={{ marginBottom: 6 }}>
        <Link href="/chama" style={{ color: "var(--soft)", fontSize: 14 }}>
          <i className="ti ti-arrow-left" /> Chamas
        </Link>
      </div>
      <h1 className="page-title">Create a chama</h1>
      <p className="page-sub">Start a group wallet, then invite friends. Only accepted members can see inside.</p>

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
        <Button block variant="gold" style={{ marginTop: 18 }} onClick={onCreate} disabled={!name || !satsNum || creating}>
          {creating ? "Creating…" : <><i className="ti ti-users" /> Create chama</>}
        </Button>
      </div>
    </>
  );
}
