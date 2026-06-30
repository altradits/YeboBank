"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import { sendLightning } from "@/lib/api";
import { ATMCard } from "@/components/app/ATMCard";
import { mockUser } from "@/lib/mock";

export default function SendPage() {
  const rate = useRate();
  const [tab, setTab] = useState<"send" | "receive">("send");
  const [dest, setDest] = useState("");
  const [sats, setSats] = useState("5000");
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);

  const satsNum = parseInt(sats.replace(/[^0-9]/g, ""), 10) || 0;

  async function onSend() {
    await sendLightning(dest, satsNum);
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  }
  function copyAddr() {
    if (navigator.clipboard) navigator.clipboard.writeText(mockUser.lightningAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <>
      <h1 className="page-title">Send &amp; receive</h1>
      <p className="page-sub">Move sats anywhere over Lightning — instantly.</p>

      <ATMCard variant="full" balanceLabel="BALANCE AVAILABLE TO SEND" />

      <div className="seg" style={{ marginTop: 20 }}>
        <button className={tab === "send" ? "on" : ""} onClick={() => setTab("send")}>Send</button>
        <button className={tab === "receive" ? "on" : ""} onClick={() => setTab("receive")}>Receive</button>
      </div>

      {tab === "send" ? (
        <div className="card" style={{ marginTop: 18 }}>
          <label className="field-group">
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>To</span>
            <input className="input" placeholder="Lightning address or invoice"
              value={dest} onChange={(e) => setDest(e.target.value)} />
          </label>
          <label className="field-group" style={{ marginTop: 16 }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>Amount in sats</span>
            <input className="amount-input" inputMode="numeric" value={sats}
              onChange={(e) => setSats(e.target.value)} />
          </label>
          <p className="note" style={{ textAlign: "center", marginTop: 12 }}>
            ≈ KES {num(satsNum * rate.kesPerSat, 2)} · free to other YeboBank members
          </p>
          <Button block style={{ marginTop: 18 }} onClick={onSend} disabled={!dest || !satsNum}>
            <i className="ti ti-send" /> Send now
          </Button>
          {done && <p className="note" style={{ marginTop: 14, textAlign: "center", color: "var(--emerald-deep)" }}>Sent! Payment confirmed.</p>}
        </div>
      ) : (
        <div className="card" style={{ marginTop: 18, textAlign: "center" }}>
          <div className="qr" />
          <p className="note" style={{ marginTop: 16 }}>Anyone, anywhere can pay you at your Lightning address:</p>
          <div className="la-chip" style={{ marginTop: 12 }}>
            <i className="ti ti-bolt" style={{ color: "var(--gold)" }} />
            <span className="addr">{mockUser.lightningAddress}</span>
            <button className="cpy" onClick={copyAddr} aria-label="Copy address">
              <i className={copied ? "ti ti-check" : "ti ti-copy"} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
