"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRate } from "@/lib/rate-context";
import { num } from "@/lib/format";
import { getWallet, getUser, depositMpesa, depositLightning } from "@/lib/api";
import type { Wallet, User } from "@/types";
import LogoMark from "@/components/ui/LogoMark";
import Button from "@/components/ui/Button";

type DepositMethod = "mpesa" | "lightning" | "onchain";

export default function DepositPage() {
  const router = useRouter();
  const rate = useRate();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [method, setMethod] = useState<DepositMethod>("mpesa");

  // Form states
  const [kesAmount, setKesAmount] = useState<string>("1000");
  const [satsAmount, setSatsAmount] = useState<string>("10000");
  const [phone, setPhone] = useState<string>("");

  // Status states
  const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");
  const [invoice, setInvoice] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [creditedSats, setCreditedSats] = useState<number>(0);

  useEffect(() => {
    getWallet().then(setWallet);
    getUser().then((u) => {
      setUser(u);
      if (u?.phone) setPhone(u.phone);
    });
  }, []);

  const kesNum = parseFloat(kesAmount.replace(/[^0-9.]/g, "")) || 0;
  const calculatedSatsFromKes = Math.round(kesNum * rate.satsPerKes);
  const satsNum = parseInt(satsAmount.replace(/\D/g, ""), 10) || 0;
  const calculatedKesFromSats = Math.round(satsNum * rate.kesPerSat);

  const handleMpesaDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (kesNum <= 0) return;
    setStatus("processing");

    try {
      const res = await depositMpesa(kesNum, rate.satsPerKes);
      setCreditedSats(res.satsCredited || calculatedSatsFromKes);
      setStatus("success");
      const updatedWallet = await getWallet();
      setWallet(updatedWallet);
    } catch {
      setStatus("idle");
    }
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (satsNum <= 0) return;
    setStatus("processing");

    try {
      const res = await depositLightning(satsNum);
      setInvoice(res.invoice);
      setCreditedSats(satsNum);
      setStatus("success");
      const updatedWallet = await getWallet();
      setWallet(updatedWallet);
    } catch {
      setStatus("idle");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lightningAddress = user?.phone ? `${user.phone.replace("+", "")}@yebobank.com` : "yourwallet@yebobank.com";
  const onChainAddress = "bc1q9yebo8bank24crossborder7satsliquidity777x";

  return (
    <div className="deposit-page-wrap">
      {/* ── Top Header ── */}
      <div className="deposit-head">
        <div className="deposit-badge">
          <LogoMark size={22} />
          <span>Direct Wallet Inflow</span>
        </div>
        <h1 className="page-title">Deposit Bitcoin</h1>
        <p className="page-sub">
          Top up your YeboBank wallet with Bitcoin Sats instantly via M-Pesa or Lightning with 0% network markup.
        </p>
      </div>

      {/* ── Balance Preview Card ── */}
      <div className="deposit-balance-card">
        <div className="dbc-left">
          <span className="dbc-label">CURRENT WALLET BALANCE</span>
          <h2 className="dbc-sats">{num(wallet?.balanceSats ?? 0)} <small>sats</small></h2>
          <span className="dbc-kes">≈ KES {num((wallet?.balanceSats ?? 0) * rate.kesPerSat, 2)}</span>
        </div>
        <div className="dbc-right">
          <span className="dbc-rate-pill">1 KES ≈ {rate.satsPerKes.toFixed(1)} sats</span>
        </div>
      </div>

      {/* ── Method Selector Tabs ── */}
      <div className="deposit-tabs" role="tablist">
        <button
          type="button"
          className={`deposit-tab ${method === "mpesa" ? "active" : ""}`}
          onClick={() => { setMethod("mpesa"); setStatus("idle"); }}
        >
          <i className="ti ti-device-mobile" />
          <span>M-Pesa STK (KES ➔ Sats)</span>
        </button>

        <button
          type="button"
          className={`deposit-tab ${method === "lightning" ? "active" : ""}`}
          onClick={() => { setMethod("lightning"); setStatus("idle"); }}
        >
          <i className="ti ti-bolt" />
          <span>Lightning Network</span>
        </button>

        <button
          type="button"
          className={`deposit-tab ${method === "onchain" ? "active" : ""}`}
          onClick={() => { setMethod("onchain"); setStatus("idle"); }}
        >
          <i className="ti ti-coin" />
          <span>On-Chain Bitcoin</span>
        </button>
      </div>

      {/* ── Main Action Card ── */}
      <div className="deposit-card">
        {/* ================= METHOD 1: M-PESA STK ================= */}
        {method === "mpesa" && (
          <div>
            {status === "idle" && (
              <form onSubmit={handleMpesaDeposit} className="deposit-form">
                <div className="df-field">
                  <label className="df-label">Amount to Deposit (KES)</label>
                  <div className="df-input-wrap">
                    <span className="df-prefix">KES</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="df-input"
                      value={kesAmount}
                      onChange={(e) => setKesAmount(e.target.value)}
                      placeholder="1,000"
                    />
                  </div>
                  <div className="df-calc-hint">
                    You receive: <b>+{num(calculatedSatsFromKes)} Sats</b> in your wallet (0% fee)
                  </div>
                </div>

                {/* Quick Amount Pills */}
                <div className="df-pills">
                  {[500, 1000, 5000, 10000, 50000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className={`df-pill ${kesNum === amt ? "active" : ""}`}
                      onClick={() => setKesAmount(String(amt))}
                    >
                      KES {num(amt)}
                    </button>
                  ))}
                </div>

                <div className="df-field" style={{ marginTop: 14 }}>
                  <label className="df-label">M-Pesa Phone Number</label>
                  <input
                    type="tel"
                    className="input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    required
                  />
                </div>

                <div style={{ marginTop: 22 }}>
                  <Button variant="gold" block>
                    Deposit KES {num(kesNum)} via M-Pesa
                  </Button>
                </div>
              </form>
            )}

            {status === "processing" && (
              <div className="df-state-box">
                <div className="df-spinner" />
                <h3>Sending M-Pesa STK Push...</h3>
                <p>Please check your phone screen to enter your M-Pesa PIN for KES {num(kesNum)}.</p>
              </div>
            )}

            {status === "success" && (
              <div className="df-state-box success">
                <div className="df-success-icon"><i className="ti ti-circle-check" /></div>
                <h3>Deposit Confirmed!</h3>
                <p className="df-big-gain">+{num(creditedSats)} Sats</p>
                <p className="df-sub">Successfully credited to your wallet from M-Pesa (KES {num(kesNum)}).</p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 18 }}>
                  <Button variant="primary" onClick={() => router.push("/dashboard")}>
                    Go to Dashboard
                  </Button>
                  <Button variant="ghost" onClick={() => setStatus("idle")}>
                    Deposit More
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= METHOD 2: LIGHTNING ================= */}
        {method === "lightning" && (
          <div>
            {status === "idle" && (
              <form onSubmit={handleGenerateInvoice} className="deposit-form">
                <div className="df-field">
                  <label className="df-label">Amount in Satoshis (Sats)</label>
                  <div className="df-input-wrap">
                    <span className="df-prefix">⚡</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="df-input"
                      value={satsAmount}
                      onChange={(e) => setSatsAmount(e.target.value)}
                      placeholder="10,000"
                    />
                  </div>
                  <div className="df-calc-hint">
                    Equivalent: <b>≈ KES {num(calculatedKesFromSats, 2)}</b> (${num((satsNum / 1e8) * rate.btcUsd, 2)} USD)
                  </div>
                </div>

                {/* Quick Sats Pills */}
                <div className="df-pills">
                  {[2500, 10000, 50000, 100000, 500000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className={`df-pill ${satsNum === amt ? "active" : ""}`}
                      onClick={() => setSatsAmount(String(amt))}
                    >
                      {num(amt)} Sats
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 22 }}>
                  <Button variant="gold" block>
                    Generate Lightning Invoice
                  </Button>
                </div>

                {/* Direct Lightning Address info */}
                <div className="df-ln-addr-box">
                  <span className="df-ln-title">Or Send to Your Lightning Address:</span>
                  <div className="df-ln-pill" onClick={() => copyToClipboard(lightningAddress)}>
                    <code>{lightningAddress}</code>
                    <button type="button" className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 11 }}>
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {status === "processing" && (
              <div className="df-state-box">
                <div className="df-spinner" />
                <h3>Generating Lightning Invoice...</h3>
              </div>
            )}

            {status === "success" && (
              <div className="df-state-box">
                <div className="df-qr-placeholder">
                  {/* Visual SVG QR Code Mockup */}
                  <svg width="180" height="180" viewBox="0 0 180 180" fill="none">
                    <rect width="180" height="180" rx="12" fill="#FFFFFF" />
                    {/* QR Code Matrix Elements */}
                    <rect x="16" y="16" width="44" height="44" rx="6" fill="#071911" />
                    <rect x="22" y="22" width="32" height="32" rx="4" fill="#FFFFFF" />
                    <rect x="28" y="28" width="20" height="20" rx="2" fill="#071911" />

                    <rect x="120" y="16" width="44" height="44" rx="6" fill="#071911" />
                    <rect x="126" y="22" width="32" height="32" rx="4" fill="#FFFFFF" />
                    <rect x="132" y="28" width="20" height="20" rx="2" fill="#071911" />

                    <rect x="16" y="120" width="44" height="44" rx="6" fill="#071911" />
                    <rect x="22" y="126" width="32" height="32" rx="4" fill="#FFFFFF" />
                    <rect x="28" y="132" width="20" height="20" rx="2" fill="#071911" />

                    <circle cx="90" cy="90" r="16" fill="#D4A018" />
                    <text x="90" y="95" textAnchor="middle" fill="#071911" fontSize="14" fontWeight="bold">⚡</text>
                  </svg>
                </div>

                <h3>Scan to Pay {num(creditedSats)} Sats</h3>
                <p className="df-sub">Payable with CashApp, Strike, Blink, Phoenix, Wallet of Satoshi, or any Lightning wallet.</p>

                <div className="df-invoice-copy" onClick={() => copyToClipboard(invoice)}>
                  <span className="df-inv-text">{invoice.substring(0, 32)}...</span>
                  <button type="button" className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 12 }}>
                    {copied ? "Copied!" : "Copy Invoice"}
                  </button>
                </div>

                <div style={{ marginTop: 18 }}>
                  <Button variant="ghost" onClick={() => setStatus("idle")}>
                    New Deposit
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= METHOD 3: ON-CHAIN ================= */}
        {method === "onchain" && (
          <div className="df-state-box">
            <div className="df-qr-placeholder">
              <svg width="180" height="180" viewBox="0 0 180 180" fill="none">
                <rect width="180" height="180" rx="12" fill="#FFFFFF" />
                <rect x="16" y="16" width="44" height="44" rx="6" fill="#071911" />
                <rect x="22" y="22" width="32" height="32" rx="4" fill="#FFFFFF" />
                <rect x="28" y="28" width="20" height="20" rx="2" fill="#071911" />

                <rect x="120" y="16" width="44" height="44" rx="6" fill="#071911" />
                <rect x="126" y="22" width="32" height="32" rx="4" fill="#FFFFFF" />
                <rect x="132" y="28" width="20" height="20" rx="2" fill="#071911" />

                <rect x="16" y="120" width="44" height="44" rx="6" fill="#071911" />
                <rect x="22" y="126" width="32" height="32" rx="4" fill="#FFFFFF" />
                <rect x="28" y="132" width="20" height="20" rx="2" fill="#071911" />

                <circle cx="90" cy="90" r="16" fill="#071911" />
                <text x="90" y="95" textAnchor="middle" fill="#F3D268" fontSize="14" fontWeight="bold">₿</text>
              </svg>
            </div>

            <h3>Your Native SegWit Bitcoin Address</h3>
            <p className="df-sub">Send on-chain BTC from Binance, Coinbase, Kraken, or any exchange. Credited to your wallet after 1 confirmation.</p>

            <div className="df-invoice-copy" onClick={() => copyToClipboard(onChainAddress)}>
              <span className="df-inv-text">{onChainAddress}</span>
              <button type="button" className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 12 }}>
                {copied ? "Copied!" : "Copy Address"}
              </button>
            </div>

            <p style={{ fontSize: 11, color: "#638072", marginTop: 12 }}>
              Minimum deposit: 5,000 sats · Network confirmation time: ~10 minutes
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
