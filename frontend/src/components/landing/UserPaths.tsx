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
    pill: "Open",
    pillVariant: "open",
    name: "Member",
    desc: "Save sats.",
    features: [
      "M-Pesa in",
      "Lock sats",
      "Group chama",
      "Send global",
    ],
    primaryLabel: "Open account",
    primaryPath: "/register",
    demoLabel: "Try demo",
    demoPath: "/dashboard",
  },
  {
    id: "agent",
    icon: "ti-cash",
    pill: "Apply",
    pillVariant: "apply",
    name: "Agent",
    desc: "Cash point.",
    features: [
      "Cash in/out",
      "Float control",
      "Commission",
      "Panic switch",
    ],
    primaryLabel: "Apply",
    primaryPath: "/register?type=agent",
    demoLabel: "Try demo",
    demoPath: "/agent",
  },
  {
    id: "investor",
    icon: "ti-trending-up",
    pill: "Invite only",
    pillVariant: "invite",
    name: "Investor",
    desc: "Monthly yield.",
    features: [
      "Monthly returns",
      "KES / sats",
      "FI planner",
      "Clean exit",
    ],
    primaryLabel: "Request",
    primaryPath: "/invest",
    demoLabel: "Try demo",
    demoPath: "/invest",
  },
  {
    id: "steward",
    icon: "ti-shield-lock",
    pill: "Appointed",
    pillVariant: "appointed",
    name: "Steward",
    desc: "Manage pool.",
    features: [
      "Approve access",
      "Income log",
      "Deploy capital",
      "Rotate card",
    ],
    demoLabel: "Open console",
    demoPath: "/steward",
  },
];

export default function UserPaths() {
  const router = useRouter();

  return (
    <section className="paths-sec" id="paths">
      <div className="wrap">
        <div className="paths-intro">
          <div className="kicker reveal">Your path.</div>
          <h2 className="h2 reveal d1" style={{ marginTop: 14 }}>
            Four <span className="accent">roles.</span>
          </h2>
          <p className="lead reveal d2" style={{ marginTop: 14 }}>
            Role-locked dashboards. Nothing extra.
          </p>
        </div>

        <div className="paths-grid">
          {PATHS.map((p, i) => (
            <div
              key={p.id}
              className={`path-card path-card--${p.id} reveal`}
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <div className="path-card-top">
                <div className={`path-icon-ring path-icon-ring--${p.id}`}>
                  <i className={`ti ${p.icon}`} />
                </div>
                <span className={`path-pill path-pill--${p.pillVariant}`}>{p.pill}</span>
              </div>

              <h3 className="path-name">{p.name}</h3>
              <p className="path-desc">{p.desc}</p>

              <ul className="path-features">
                {p.features.map((f) => <li key={f}>{f}</li>)}
              </ul>

              <div className="path-actions">
                {p.primaryLabel && (
                  <Button variant="gold" onClick={() => router.push(p.primaryPath!)} block>
                    {p.primaryLabel}
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
