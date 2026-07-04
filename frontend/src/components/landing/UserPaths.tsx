"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

interface PathCard {
  id: "member" | "agent" | "investor" | "steward";
  icon: string;
  pill: string;
  pillVariant: "open" | "apply" | "invite" | "appointed";
  name: string;
  desc: string;
  features: string[];
  primaryLabel?: string;
  primaryPath?: string;
  demoLabel: string;
  demoPath: string;
}

const PATHS: PathCard[] = [
  {
    id: "member",
    icon: "ti-piggy-bank",
    pill: "Open to everyone",
    pillVariant: "open",
    name: "Savings Member",
    desc: "Save your shillings in Bitcoin. Lock them for 1–7 years and earn compounded returns while Lightning keeps you connected to the global economy.",
    features: [
      "Deposit via M-Pesa or Lightning",
      "Bitcoin savings locks (1–7 years)",
      "Chama group savings & voting",
      "Send money worldwide in seconds",
    ],
    primaryLabel: "Open account",
    primaryPath: "/register",
    demoLabel: "Try member demo",
    demoPath: "/dashboard",
  },
  {
    id: "agent",
    icon: "ti-cash",
    pill: "Apply to join",
    pillVariant: "apply",
    name: "M-Pesa Agent",
    desc: "Be a YeboBank cash point in your community. Handle cash-in and cash-out for clients, earn commissions on every transaction, and manage your float securely.",
    features: [
      "Cash in / cash out for clients",
      "Float and reserve management",
      "Commission tracking",
      "Emergency panic system",
    ],
    primaryLabel: "Apply as agent",
    primaryPath: "/register?type=agent",
    demoLabel: "Try agent demo",
    demoPath: "/agent",
  },
  {
    id: "investor",
    icon: "ti-trending-up",
    pill: "By invitation",
    pillVariant: "invite",
    name: "F&F Investor",
    desc: "Invest alongside the Fund Steward and earn compounded monthly returns on your capital — in Kenya shillings or Bitcoin, tracked to the satoshi.",
    features: [
      "Monthly compounded returns",
      "KES or Bitcoin positions",
      "Financial independence calculator",
      "Transparent withdrawal requests",
    ],
    primaryLabel: "Request access",
    primaryPath: "/invest",
    demoLabel: "Try investor demo",
    demoPath: "/invest",
  },
  {
    id: "steward",
    icon: "ti-shield-lock",
    pill: "Appointed role",
    pillVariant: "appointed",
    name: "Fund Steward",
    desc: "Manage the investment pool — approve investors, register income sources, deploy capital, and issue a rotating virtual card for safe transactions.",
    features: [
      "Investor access approval",
      "Income source registry",
      "Pool deployment & tracking",
      "Rotating virtual card (OTC CVV)",
    ],
    demoLabel: "Open steward console",
    demoPath: "/steward",
  },
];

export default function UserPaths() {
  const router = useRouter();

  return (
    <section className="paths-sec" id="paths">
      <div className="wrap">
        <div className="paths-intro">
          <div className="kicker reveal">Four ways to use YeboBank</div>
          <h2 className="h2 reveal d1" style={{ marginTop: 14 }}>
            Choose your <span className="accent">path.</span>
          </h2>
          <p className="lead reveal d2" style={{ marginTop: 16 }}>
            Each user group has a purpose-built dashboard with only the tools they need — nothing else.
            Every role is enforced at the server and in the app so no one can access what isn&apos;t theirs.
          </p>
        </div>

        <div className="paths-grid">
          {PATHS.map((p, i) => (
            <div
              key={p.id}
              className={`path-card path-card--${p.id} reveal`}
              style={{ transitionDelay: `${i * 0.07}s` }}
            >
              <div className={`path-icon-ring path-icon-ring--${p.id}`}>
                <i className={`ti ${p.icon}`} />
              </div>

              <span className={`path-pill path-pill--${p.pillVariant}`}>{p.pill}</span>

              <h3 className="path-name">{p.name}</h3>
              <p className="path-desc">{p.desc}</p>

              <ul className="path-features">
                {p.features.map((f) => <li key={f}>{f}</li>)}
              </ul>

              <div className="path-actions">
                {p.primaryLabel && (
                  <Button variant="gold" onClick={() => router.push(p.primaryPath!)} block>
                    {p.primaryLabel} <i className="ti ti-arrow-right" />
                  </Button>
                )}
                <Button variant="ghost" onDark onClick={() => router.push(p.demoPath)} block>
                  {p.demoLabel}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
