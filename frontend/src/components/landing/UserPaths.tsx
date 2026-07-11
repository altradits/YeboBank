"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

interface Step { icon: string; text: string }
interface PathCard {
  id: "member" | "agent" | "investor" | "mlinzi";
  icon: string;
  pill: string;
  pillVariant: "open" | "apply" | "invite" | "appointed";
  name: string;
  tagline: string;
  entry: string;
  steps: Step[];
  primaryLabel?: string;
  primaryPath?: string;
  primaryVariant?: "gold" | "ghost";
}

const PATHS: PathCard[] = [
  {
    id: "member",
    icon: "ti-piggy-bank",
    pill: "Open",
    pillVariant: "open",
    name: "Member",
    tagline: "Save in sats. Spend in shillings.",
    entry: "Phone + M-Pesa OTP",
    steps: [
      { icon: "ti-arrow-down", text: "Deposit via M-Pesa or Lightning" },
      { icon: "ti-lock",       text: "Lock sats — earn ~5.2% APY" },
      { icon: "ti-users",      text: "Join a chama — save as a group" },
      { icon: "ti-send",       text: "Send globally via Lightning" },
    ],
    primaryLabel: "Open free account",
    primaryPath: "/login?redirect=/dashboard",
  },
  {
    id: "agent",
    icon: "ti-cash",
    pill: "Apply",
    pillVariant: "apply",
    name: "Agent",
    tagline: "The cash point in your neighbourhood.",
    entry: "Register + deposit float",
    steps: [
      { icon: "ti-device-mobile", text: "Look up customer by phone" },
      { icon: "ti-arrows-exchange", text: "Cash in / out at live rate" },
      { icon: "ti-coin",           text: "0.5% commission per transaction" },
      { icon: "ti-shield-lock",    text: "Panic button + time-locked reserve" },
    ],
    primaryLabel: "Apply to become agent",
    primaryPath: "/login?redirect=/agent",
    primaryVariant: "ghost",
  },
  {
    id: "investor",
    icon: "ti-trending-up",
    pill: "Invite only",
    pillVariant: "invite",
    name: "Investor",
    tagline: "Monthly yield from real assets.",
    entry: "Access request → Mlinzi approval",
    steps: [
      { icon: "ti-file-text",    text: "View principal + current value" },
      { icon: "ti-calendar",     text: "Monthly statements, append-only" },
      { icon: "ti-calculator",   text: "FI Calculator — years to independence" },
      { icon: "ti-arrow-up-circle", text: "Request withdrawal anytime" },
    ],
    primaryLabel: "Request access",
    primaryPath: "/login?redirect=/invest",
    primaryVariant: "ghost",
  },
  {
    id: "mlinzi",
    icon: "ti-shield-lock",
    pill: "Appointed",
    pillVariant: "appointed",
    name: "Mlinzi",
    tagline: "Deploy capital. Earn management fees.",
    entry: "Pre-approved appointment",
    steps: [
      { icon: "ti-building-bank",  text: "AUM overview — KES + sats" },
      { icon: "ti-send-2",         text: "Deploy via M-Pesa, Lightning, or card" },
      { icon: "ti-users-group",    text: "Manage investor positions + statements" },
      { icon: "ti-credit-card",    text: "One-time CVV card — auto-rotates" },
    ],
  },
];

const STATS = [
  { icon: "ti-coins",        value: "5.2%", label: "Target APY" },
  { icon: "ti-map-pin",      value: "47",   label: "Kenya counties" },
  { icon: "ti-bolt",         value: "<3s",  label: "Lightning settlement" },
  { icon: "ti-lock-open",    value: "0%",   label: "Signup fee" },
];

export default function UserPaths() {
  const router = useRouter();

  return (
    <>
      {/* ── Platform stats strip ── */}
      <div className="platform-stats-strip">
        <div className="wrap">
          <div className="pss-grid">
            {STATS.map((s) => (
              <div key={s.label} className="pss-item">
                <i className={`ti ${s.icon} pss-icon`} />
                <div>
                  <span className="pss-value">{s.value}</span>
                  <span className="pss-label">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Four roles section ── */}
      <section className="paths-sec" id="paths">
        <div className="wrap">
          <div className="paths-intro">
            <div className="kicker reveal">Your role.</div>
            <h2 className="h2 reveal d1" style={{ marginTop: 14 }}>
              Four <span className="accent">paths.</span> One platform.
            </h2>
            <p className="lead reveal d2" style={{ marginTop: 14 }}>
              Purpose-built dashboards. No feature clutter. Role-locked from day one.
            </p>
          </div>

          <div className="paths-grid paths-grid--4">
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
                <p className="path-tagline">{p.tagline}</p>

                <div className="path-entry">
                  <i className="ti ti-door-enter" />
                  <span>{p.entry}</span>
                </div>

                <ul className="path-steps">
                  {p.steps.map((s) => (
                    <li key={s.text}>
                      <i className={`ti ${s.icon}`} />
                      <span>{s.text}</span>
                    </li>
                  ))}
                </ul>

                {p.primaryLabel && (
                  <div className="path-actions">
                    <Button
                      variant={p.primaryVariant ?? "gold"}
                      onClick={() => router.push(p.primaryPath!)}
                      block
                    >
                      {p.primaryLabel}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
