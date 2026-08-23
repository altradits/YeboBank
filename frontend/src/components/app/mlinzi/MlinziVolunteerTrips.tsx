"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import SecurityTransactionGuard from "@/components/ui/SecurityTransactionGuard";
import type { VolunteerTrip } from "./types";

const UPCOMING_TRIPS: VolunteerTrip[] = [
  {
    id: "trip-1",
    title: "Nairobi Tech & Lightning Hub Expedition",
    location: "Nairobi & Kiambu, Kenya",
    dates: "October 14 – 21, 2026",
    focus: "Open-source developer mentorship & POS merchant setup",
    image: "ti-code",
    slotsRemaining: 6,
    logisticsDonationTargetUsd: 12_000,
    logisticsDonationRaisedUsd: 8_450,
  },
  {
    id: "trip-2",
    title: "Lamu Solar & Community Micro-Grid Co-op",
    location: "Lamu Archipelago, Kenya Coast",
    dates: "November 08 – 16, 2026",
    focus: "Solar mini-grid installations & local duka electrification",
    image: "ti-sun",
    slotsRemaining: 4,
    logisticsDonationTargetUsd: 18_000,
    logisticsDonationRaisedUsd: 14_200,
  },
  {
    id: "trip-3",
    title: "Rift Valley Agri-Tech & Duka Immersion",
    location: "Naivasha & Nakuru, Kenya",
    dates: "December 01 – 08, 2026",
    focus: "Smallholder farmer grain storage & Bitcoin settlement rails",
    image: "ti-plant",
    slotsRemaining: 8,
    logisticsDonationTargetUsd: 15_000,
    logisticsDonationRaisedUsd: 9_800,
  },
  {
    id: "trip-4",
    title: "Kigali Innovation & Cross-Border Trade Summit",
    location: "Kigali & Rubavu, Rwanda",
    dates: "January 15 – 22, 2027",
    focus: "Cross-border African merchant payments & developer hackathon",
    image: "ti-world",
    slotsRemaining: 5,
    logisticsDonationTargetUsd: 20_000,
    logisticsDonationRaisedUsd: 11_500,
  },
];

export default function MlinziVolunteerTrips() {
  const [selectedTrip, setSelectedTrip] = useState<VolunteerTrip | null>(null);
  const [modalMode, setModalMode] = useState<"register" | "donate" | null>(null);

  // Register Form State
  const [regForm, setRegForm] = useState({ name: "", email: "", phone: "", background: "", motivation: "" });
  const [regSubmitted, setRegSubmitted] = useState(false);

  // Donate State
  const [donationAmount, setDonationAmount] = useState(50);
  const [donateSuccess, setDonateSuccess] = useState(false);

  function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRegSubmitted(true);
    setTimeout(() => {
      setRegSubmitted(false);
      setModalMode(null);
    }, 2500);
  }

  function handleDonationConfirm() {
    setDonateSuccess(true);
    setTimeout(() => {
      setDonateSuccess(false);
      setModalMode(null);
    }, 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header Banner */}
      <div className="card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <i className="ti ti-compass" style={{ fontSize: 24, color: "var(--gold-text)" }} />
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700 }}>
            Volunteer &amp; Explore Africa
          </h2>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14, maxWidth: 680 }}>
          Connect directly with local communities and developers. Explore Africa, immerse in culture, provide hands-on technical and business mentorship, and contribute to lasting local solutions.
        </p>
      </div>

      {/* Trip Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
        {UPCOMING_TRIPS.map((trip) => {
          const fundedPct = Math.round((trip.logisticsDonationRaisedUsd / trip.logisticsDonationTargetUsd) * 100);
          return (
            <div
              key={trip.id}
              className="card"
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 14,
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(240, 204, 88, 0.15)", color: "var(--gold-text)", display: "grid", placeItems: "center", fontSize: 18 }}>
                      <i className={`ti ${trip.image}`} />
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--emerald-deep)" }}>{trip.location}</span>
                  </div>
                  <span style={{ fontSize: 11, background: "var(--cream)", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: 999 }}>
                    {trip.slotsRemaining} slots left
                  </span>
                </div>

                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, lineHeight: 1.3, marginBottom: 6 }}>
                  {trip.title}
                </h3>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
                  <i className="ti ti-calendar" /> {trip.dates}
                </div>
                <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.45, marginBottom: 12 }}>
                  {trip.focus}
                </p>

                {/* Logistics Funding Progress */}
                <div style={{ background: "var(--cream)", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-soft)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: "var(--muted)" }}>Logistics Pool Funded:</span>
                    <strong style={{ fontFamily: "var(--font-mono)" }}>${trip.logisticsDonationRaisedUsd.toLocaleString()} / ${trip.logisticsDonationTargetUsd.toLocaleString()} ({fundedPct}%)</strong>
                  </div>
                  <div style={{ width: "100%", height: 6, background: "var(--surface)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${fundedPct}%`, height: "100%", background: "var(--gold)" }} />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                <Button
                  variant="gold"
                  onClick={() => {
                    setSelectedTrip(trip);
                    setModalMode("register");
                  }}
                  style={{ flex: 1, fontSize: 13 }}
                >
                  Register Interest
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedTrip(trip);
                    setModalMode("donate");
                  }}
                  style={{ flex: 1, fontSize: 13 }}
                >
                  Donate Logistics
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Register Interest */}
      {modalMode === "register" && selectedTrip && (
        <div className="modal-overlay" onClick={() => setModalMode(null)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalMode(null)}>✕</button>

            {regSubmitted ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <i className="ti ti-circle-check" style={{ fontSize: 44, color: "var(--emerald-deep)" }} />
                <h4 style={{ marginTop: 8 }}>Registration Received</h4>
                <p style={{ fontSize: 13, color: "var(--muted)" }}>
                  Our trip coordinator will reach out with travel logistics and briefing documents.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>
                  Register for {selectedTrip.title}
                </h3>
                <p style={{ fontSize: 12, color: "var(--muted)" }}>
                  Dates: {selectedTrip.dates} · Location: {selectedTrip.location}
                </p>

                <div className="field-group">
                  <label>Full Name</label>
                  <input className="input" required value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} />
                </div>
                <div className="grid-2">
                  <div className="field-group">
                    <label>Email</label>
                    <input className="input" type="email" required value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} />
                  </div>
                  <div className="field-group">
                    <label>Phone Number</label>
                    <input className="input" required value={regForm.phone} onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })} />
                  </div>
                </div>
                <div className="field-group">
                  <label>Your Background / Skills (e.g. Engineering, Solar, Retail, Finance)</label>
                  <input className="input" required placeholder="Software Engineer / Solar installer / Biz Dev" value={regForm.background} onChange={(e) => setRegForm({ ...regForm, background: e.target.value })} />
                </div>
                <div className="field-group">
                  <label>Motivation / What you hope to contribute</label>
                  <textarea className="input" rows={2} required placeholder="Why do you want to join this trip?" value={regForm.motivation} onChange={(e) => setRegForm({ ...regForm, motivation: e.target.value })} />
                </div>

                <Button type="submit" variant="gold" block>
                  Confirm Registration
                </Button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Donate toward trip logistics (Protected by Security Guard) */}
      {modalMode === "donate" && selectedTrip && (
        <div className="modal-overlay" onClick={() => setModalMode(null)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalMode(null)}>✕</button>

            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, marginBottom: 4 }}>
              Donate toward Trip Logistics
            </h3>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
              Supporting ground transport, solar equipment freight, and developer stipends for <strong>{selectedTrip.title}</strong>.
            </p>

            <div className="field-group" style={{ marginBottom: 12 }}>
              <label>Donation Amount (USD)</label>
              <div className="seg" style={{ marginBottom: 8 }}>
                {[25, 50, 100, 250, 500].map((amt) => (
                  <button key={amt} className={donationAmount === amt ? "on" : ""} onClick={() => setDonationAmount(amt)}>
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            {donateSuccess ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <i className="ti ti-heart-handshake" style={{ fontSize: 44, color: "var(--emerald-deep)" }} />
                <h4 style={{ marginTop: 8 }}>Asante Sana! Donation Confirmed</h4>
                <p style={{ fontSize: 12, color: "var(--muted)" }}>Your contribution directly empowers local builders and travelers.</p>
              </div>
            ) : (
              <SecurityTransactionGuard
                amount={donationAmount}
                currencyName="USD"
                onConfirm={handleDonationConfirm}
                onClose={() => setModalMode(null)}
                confirmLabel="Donate"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
