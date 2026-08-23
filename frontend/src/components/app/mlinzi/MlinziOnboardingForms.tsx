"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";

interface OnboardingProps {
  initialForm?: "investor" | "beneficiary" | "manager";
  onComplete: (formType: string, data: any) => void;
}

export default function MlinziOnboardingForms({
  initialForm = "investor",
  onComplete,
}: OnboardingProps) {
  const [activeTab, setActiveTab] = useState<"investor" | "beneficiary" | "manager">(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [submittedType, setSubmittedType] = useState("");

  // Form A: Investor State
  const [invData, setInvData] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "Kenya",
    investmentType: "Equity",
    capitalRange: "$10k-$50k",
    preferredSector: "Tech",
    riskTolerance: "Medium",
    expectedReturn: "10-20%",
    mandateFileName: "",
    kycFileName: "",
  });

  // Form B: Beneficiary State
  const [benData, setBenData] = useState({
    businessName: "",
    regNumber: "",
    physicalAddress: "",
    ownerName: "",
    phone: "",
    email: "",
    businessType: "Retail Store",
    yearsInOperation: "1-3",
    fundingRequest: "$5k-$20k",
    purpose: "Inventory",
    currentMonthlyRevenue: "",
    regCertFileName: "",
    taxPinFileName: "",
    bankStatementsFileName: "",
    businessPlanFileName: "",
  });

  // Form C: Fund Manager State
  const [mgrData, setMgrData] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "Kenya",
    expertise: "Crypto/Bitcoin",
    trackRecordFileName: "",
    aum: "$50k-$200k",
    strategyDescription: "",
    ref1Name: "",
    ref1Contact: "",
    ref2Name: "",
    ref2Contact: "",
    complianceFileName: "",
  });

  function handleSubmitInvestor(e: React.FormEvent) {
    e.preventDefault();
    onComplete("investor", invData);
    setSubmittedType("Investor / Sponsor");
    setSubmitted(true);
  }

  function handleSubmitBeneficiary(e: React.FormEvent) {
    e.preventDefault();
    onComplete("beneficiary", benData);
    setSubmittedType("Beneficiary Business");
    setSubmitted(true);
  }

  function handleSubmitManager(e: React.FormEvent) {
    e.preventDefault();
    onComplete("manager", mgrData);
    setSubmittedType("Fund Manager");
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "40px 24px" }}>
        <div style={{ fontSize: 48, color: "var(--emerald-deep)", marginBottom: 12 }}>
          <i className="ti ti-circle-check" />
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 8 }}>
          {submittedType} Application Submitted
        </h2>
        <p style={{ color: "var(--muted)", maxWidth: 460, margin: "0 auto 20px" }}>
          Status: <strong style={{ color: "var(--gold-text)" }}>Pending Review</strong>. The Mlinzi administrator has been notified and will verify your mandate and schedule physical/KYC verification.
        </p>
        <Button variant="gold" onClick={() => setSubmitted(false)}>
          Submit Another Application
        </Button>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "28px" }}>
      {/* 3 Pillars Segmented Switch */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20 }}>Digital Onboarding</h2>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>Select your pillar to join the Mlinzi ecosystem.</p>
        </div>
        <div className="seg">
          <button className={activeTab === "investor" ? "on" : ""} onClick={() => setActiveTab("investor")}>
            <i className="ti ti-coin" /> A. Investor / Sponsor
          </button>
          <button className={activeTab === "beneficiary" ? "on" : ""} onClick={() => setActiveTab("beneficiary")}>
            <i className="ti ti-building-store" /> B. Beneficiary
          </button>
          <button className={activeTab === "manager" ? "on" : ""} onClick={() => setActiveTab("manager")}>
            <i className="ti ti-chart-line" /> C. Fund Manager
          </button>
        </div>
      </div>

      {/* FORM A: Investor/Sponsor */}
      {activeTab === "investor" && (
        <form onSubmit={handleSubmitInvestor} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="grid-2">
            <div className="field-group">
              <label>Full Name</label>
              <input
                className="input"
                required
                placeholder="Dr. Stanley Mwangi"
                value={invData.fullName}
                onChange={(e) => setInvData({ ...invData, fullName: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label>Email Address</label>
              <input
                className="input"
                type="email"
                required
                placeholder="investor@domain.com"
                value={invData.email}
                onChange={(e) => setInvData({ ...invData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="field-group">
              <label>Phone Number (M-Pesa registered)</label>
              <input
                className="input"
                required
                placeholder="+254 700 000000"
                value={invData.phone}
                onChange={(e) => setInvData({ ...invData, phone: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label>Country of Residence</label>
              <input
                className="input"
                required
                placeholder="Kenya / USA / UK"
                value={invData.country}
                onChange={(e) => setInvData({ ...invData, country: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
            <div className="field-group">
              <label>Investment Type</label>
              <select
                className="input"
                value={invData.investmentType}
                onChange={(e) => setInvData({ ...invData, investmentType: e.target.value })}
              >
                <option value="Equity">Equity</option>
                <option value="Debt">Debt (Yield Loan)</option>
                <option value="Donation">Donation (Impact)</option>
                <option value="Fund-of-Funds">Fund-of-Funds (BTC)</option>
              </select>
            </div>
            <div className="field-group">
              <label>Capital Range</label>
              <select
                className="input"
                value={invData.capitalRange}
                onChange={(e) => setInvData({ ...invData, capitalRange: e.target.value })}
              >
                <option value="$1k-$10k">$1k – $10k</option>
                <option value="$10k-$50k">$10k – $50k</option>
                <option value="$50k-$100k">$50k – $100k</option>
                <option value="$100k+">$100k+</option>
              </select>
            </div>
            <div className="field-group">
              <label>Preferred Sector</label>
              <select
                className="input"
                value={invData.preferredSector}
                onChange={(e) => setInvData({ ...invData, preferredSector: e.target.value })}
              >
                <option value="Retail">Retail &amp; Duka</option>
                <option value="Hospitality">Hospitality / Airbnb</option>
                <option value="Tech">Tech &amp; Lightning</option>
                <option value="Agriculture">Agriculture / Farming</option>
                <option value="Renewable Energy">Renewable Energy</option>
                <option value="Tourism">Eco-Tourism</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="field-group">
              <label>Risk Tolerance</label>
              <select
                className="input"
                value={invData.riskTolerance}
                onChange={(e) => setInvData({ ...invData, riskTolerance: e.target.value })}
              >
                <option value="Low">Low (Asset-Backed Debt)</option>
                <option value="Medium">Medium (Revenue-Share)</option>
                <option value="High">High (Venture Equity)</option>
              </select>
            </div>
            <div className="field-group">
              <label>Expected Return</label>
              <select
                className="input"
                value={invData.expectedReturn}
                onChange={(e) => setInvData({ ...invData, expectedReturn: e.target.value })}
              >
                <option value="Social Impact Only">Social Impact Only (0%)</option>
                <option value="5-10%">5 – 10% APY</option>
                <option value="10-20%">10 – 20% APY</option>
                <option value="20%+">20%+ Target</option>
              </select>
            </div>
          </div>

          {/* Document Uploads */}
          <div className="grid-2" style={{ padding: "16px", background: "var(--cream)", borderRadius: 12, border: "1px solid var(--border-soft)" }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                <i className="ti ti-file-text" /> Signed Investment Mandate (PDF)
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setInvData({ ...invData, mandateFileName: e.target.files?.[0]?.name ?? "mandate.pdf" })}
                style={{ fontSize: 12 }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                <i className="ti ti-id" /> ID/Passport + Proof of Address
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.png"
                onChange={(e) => setInvData({ ...invData, kycFileName: e.target.files?.[0]?.name ?? "kyc_doc.pdf" })}
                style={{ fontSize: 12 }}
              />
            </div>
          </div>

          <Button type="submit" variant="gold" block>
            Submit Investor Application
          </Button>
        </form>
      )}

      {/* FORM B: Beneficiary */}
      {activeTab === "beneficiary" && (
        <form onSubmit={handleSubmitBeneficiary} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="grid-2">
            <div className="field-group">
              <label>Business Name</label>
              <input
                className="input"
                required
                placeholder="Mama Mboga Fresh Grocers"
                value={benData.businessName}
                onChange={(e) => setBenData({ ...benData, businessName: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label>Business Registration / Tax PIN</label>
              <input
                className="input"
                required
                placeholder="BN-2024-884920"
                value={benData.regNumber}
                onChange={(e) => setBenData({ ...benData, regNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="field-group">
            <label>Physical Address / Location</label>
            <input
              className="input"
              required
              placeholder="Shop 14, Biashara Street, Nairobi"
              value={benData.physicalAddress}
              onChange={(e) => setBenData({ ...benData, physicalAddress: e.target.value })}
            />
          </div>

          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
            <div className="field-group">
              <label>Owner Full Name</label>
              <input
                className="input"
                required
                placeholder="Wanjiku Njeri"
                value={benData.ownerName}
                onChange={(e) => setBenData({ ...benData, ownerName: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label>Phone Number</label>
              <input
                className="input"
                required
                placeholder="+254 712 345678"
                value={benData.phone}
                onChange={(e) => setBenData({ ...benData, phone: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label>Email Address</label>
              <input
                className="input"
                type="email"
                required
                placeholder="wanjiku@duka.co.ke"
                value={benData.email}
                onChange={(e) => setBenData({ ...benData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
            <div className="field-group">
              <label>Business Type</label>
              <select
                className="input"
                value={benData.businessType}
                onChange={(e) => setBenData({ ...benData, businessType: e.target.value })}
              >
                <option value="Kibanda/Shop">Kibanda / Duka Shop</option>
                <option value="Airbnb/Hospitality">Airbnb / Hospitality</option>
                <option value="Retail Store">Retail Store</option>
                <option value="Wholesale">Wholesale Distribution</option>
                <option value="Service Provider">Service Provider</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="field-group">
              <label>Years in Operation</label>
              <select
                className="input"
                value={benData.yearsInOperation}
                onChange={(e) => setBenData({ ...benData, yearsInOperation: e.target.value })}
              >
                <option value="<1">&lt; 1 Year</option>
                <option value="1-3">1 – 3 Years</option>
                <option value="3-5">3 – 5 Years</option>
                <option value="5+">5+ Years</option>
              </select>
            </div>
            <div className="field-group">
              <label>Funding Request</label>
              <select
                className="input"
                value={benData.fundingRequest}
                onChange={(e) => setBenData({ ...benData, fundingRequest: e.target.value })}
              >
                <option value="$500-$5k">$500 – $5,000</option>
                <option value="$5k-$20k">$5,000 – $20,000</option>
                <option value="$20k-$50k">$20,000 – $50,000</option>
                <option value="$50k+">$50,000+</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="field-group">
              <label>Funding Purpose</label>
              <select
                className="input"
                value={benData.purpose}
                onChange={(e) => setBenData({ ...benData, purpose: e.target.value })}
              >
                <option value="Inventory">Inventory Purchase</option>
                <option value="Equipment">Equipment &amp; Machinery</option>
                <option value="Renovation">Premises Renovation</option>
                <option value="Working Capital">Working Capital</option>
                <option value="Expansion">Expansion to New Location</option>
              </select>
            </div>
            <div className="field-group">
              <label>Current Monthly Revenue (USD)</label>
              <input
                className="input"
                type="number"
                required
                placeholder="e.g. 2400"
                value={benData.currentMonthlyRevenue}
                onChange={(e) => setBenData({ ...benData, currentMonthlyRevenue: e.target.value })}
              />
            </div>
          </div>

          {/* Document Uploads */}
          <div style={{ padding: "16px", background: "var(--cream)", borderRadius: 12, border: "1px solid var(--border-soft)" }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Required Verification Documents (PDF)</p>
            <div className="grid-2" style={{ gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)" }}>Registration Cert &amp; Tax PIN</label>
                <input type="file" accept=".pdf,.png,.jpg" style={{ fontSize: 12, width: "100%" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)" }}>6 Months Bank / M-Pesa Statement</label>
                <input type="file" accept=".pdf" style={{ fontSize: 12, width: "100%" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)" }}>Business Plan &amp; 12mo Projections</label>
                <input type="file" accept=".pdf" style={{ fontSize: 12, width: "100%" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--lime)" }}>
                <i className="ti ti-device-mobile" /> POS Device will be assigned upon physical visit.
              </div>
            </div>
          </div>

          <Button type="submit" variant="gold" block>
            Submit Beneficiary Funding Request
          </Button>
        </form>
      )}

      {/* FORM C: Fund Manager */}
      {activeTab === "manager" && (
        <form onSubmit={handleSubmitManager} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="grid-2">
            <div className="field-group">
              <label>Full Name</label>
              <input
                className="input"
                required
                placeholder="Alexander Korir, CFA"
                value={mgrData.fullName}
                onChange={(e) => setMgrData({ ...mgrData, fullName: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label>Email Address</label>
              <input
                className="input"
                type="email"
                required
                placeholder="manager@capital.co.ke"
                value={mgrData.email}
                onChange={(e) => setMgrData({ ...mgrData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
            <div className="field-group">
              <label>Trading / Strategy Expertise</label>
              <select
                className="input"
                value={mgrData.expertise}
                onChange={(e) => setMgrData({ ...mgrData, expertise: e.target.value })}
              >
                <option value="Crypto/Bitcoin">Crypto &amp; Bitcoin Treasury</option>
                <option value="Stocks">Equities &amp; Stocks</option>
                <option value="Forex">Forex &amp; FX Arbitrage</option>
                <option value="Commodities">Commodities</option>
                <option value="Hedge Fund">Multi-Strategy Hedge Fund</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="field-group">
              <label>Current AUM Managed</label>
              <select
                className="input"
                value={mgrData.aum}
                onChange={(e) => setMgrData({ ...mgrData, aum: e.target.value })}
              >
                <option value="<$50k">&lt; $50k</option>
                <option value="$50k-$200k">$50k – $200k</option>
                <option value="$200k-$1M">$200k – $1M</option>
                <option value="$1M+">$1M+</option>
              </select>
            </div>
            <div className="field-group">
              <label>Country</label>
              <input
                className="input"
                required
                placeholder="Kenya / Global"
                value={mgrData.country}
                onChange={(e) => setMgrData({ ...mgrData, country: e.target.value })}
              />
            </div>
          </div>

          <div className="field-group">
            <label>Strategy Description &amp; Risk Mitigation Approach</label>
            <textarea
              className="input"
              rows={3}
              required
              placeholder="Describe your asset allocation, stop-loss strategy, Sharpe ratio, and target annualized yield."
              value={mgrData.strategyDescription}
              onChange={(e) => setMgrData({ ...mgrData, strategyDescription: e.target.value })}
            />
          </div>

          {/* References */}
          <div className="grid-2">
            <div className="field-group">
              <label>Professional Reference 1 (Name, Title, Contact)</label>
              <input
                className="input"
                required
                placeholder="John Doe, Partner @ Fund (+254 7...)"
                value={mgrData.ref1Name}
                onChange={(e) => setMgrData({ ...mgrData, ref1Name: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label>Professional Reference 2 (Name, Title, Contact)</label>
              <input
                className="input"
                required
                placeholder="Jane Smith, MD @ Securities (+254 7...)"
                value={mgrData.ref2Name}
                onChange={(e) => setMgrData({ ...mgrData, ref2Name: e.target.value })}
              />
            </div>
          </div>

          {/* Document Uploads */}
          <div className="grid-2" style={{ padding: "16px", background: "var(--cream)", borderRadius: 12, border: "1px solid var(--border-soft)" }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                <i className="ti ti-chart-dots" /> 12-Month Verified Track Record (PDF)
              </label>
              <input type="file" accept=".pdf" style={{ fontSize: 12 }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                <i className="ti ti-certificate" /> Regulatory / Compliance Documents
              </label>
              <input type="file" accept=".pdf" style={{ fontSize: 12 }} />
            </div>
          </div>

          <Button type="submit" variant="gold" block>
            Submit Fund Manager Mandate
          </Button>
        </form>
      )}
    </div>
  );
}
