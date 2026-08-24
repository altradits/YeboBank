"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import QuickProductModal, { type ProductType } from "./QuickProductModal";

interface PathCard {
  id: "member" | "agent" | "investor" | "mlinzi";
  pill: string;
  pillVariant: "open" | "apply" | "invite" | "appointed";
  name: string;
  tagline: string;
  desc: string;
  productType?: ProductType;
  quickLabel?: string;
  primaryLabel: string;
  primaryPath: string;
  primaryVariant?: "gold" | "ghost";
}

const PATHS: PathCard[] = [
  {
    id: "member",
    pill: "Instant Access",
    pillVariant: "open",
    name: "Member",
    tagline: "Individual & Group Saver",
    desc: "Personal Bitcoin treasury, automated M-Pesa deposits, and instant global payments.",
    productType: "savings",
    quickLabel: "Save",
    primaryLabel: "Register",
    primaryPath: "/login?redirect=/dashboard",
    primaryVariant: "gold",
  },
  {
    id: "agent",
    pill: "Open Application",
    pillVariant: "apply",
    name: "Agent",
    tagline: "Neighbourhood Cash Point",
    desc: "Local cash in/out float operations with instant 0.5% commission on every transaction.",
    productType: "agent",
    quickLabel: "Locate",
    primaryLabel: "Apply",
    primaryPath: "/login?redirect=/agent",
    primaryVariant: "ghost",
  },
  {
    id: "investor",
    pill: "Invite Only",
    pillVariant: "invite",
    name: "Investor",
    tagline: "Private Wealth Allocation",
    desc: "Direct deployment into audited productive assets with monthly compounded performance reports.",
    productType: "invest",
    quickLabel: "Invest",
    primaryLabel: "Request Access",
    primaryPath: "/login?redirect=/invest",
    primaryVariant: "ghost",
  },
  {
    id: "mlinzi",
    pill: "Appointed",
    pillVariant: "appointed",
    name: "Mlinzi",
    tagline: "Capital Steward",
    desc: "Full portfolio deployment console with auto-rotating cryptographic card security.",
    primaryLabel: "Enter Console",
    primaryPath: "/login?redirect=/mlinzi",
    primaryVariant: "ghost",
  },
];

export default function UserPaths() {
  const router = useRouter();
  const [quickOpen, setQuickOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<ProductType>("savings");

  const openQuick = (prod: ProductType) => {
    setActiveProduct(prod);
    setQuickOpen(true);
  };

  return (
    <>
      <section className="paths-sec" id="paths">
        <div className="wrap">
          <div className="paths-intro" style={{ textAlign: "center" }}>
            <h2 className="h2 reveal d1">
              Operate.<br />
              <span className="gold-accent">Four dedicated consoles. Zero clutter.</span>
            </h2>
            <p className="lead reveal d2" style={{ marginTop: 16, maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>
              Purpose-built operational environments locked to your specific role from day one.
            </p>
          </div>

          <div className="paths-grid paths-grid--4" style={{ marginTop: 44 }}>
            {PATHS.map((p, i) => (
              <div
                key={p.id}
                className={`path-card path-card--${p.id} reveal`}
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <div className="path-card-top">
                  <span className={`path-pill path-pill--${p.pillVariant}`}>{p.pill}</span>
                </div>

                <h3 className="path-name" style={{ marginTop: 8 }}>{p.name}</h3>
                <p className="path-tagline" style={{ fontWeight: 600, color: "var(--gold-soft)" }}>{p.tagline}</p>
                <p style={{ fontSize: 14, color: "var(--soft)", lineHeight: 1.55, margin: "12px 0 20px" }}>
                  {p.desc}
                </p>

                <div className="path-actions" style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "auto" }}>
                  {p.quickLabel && p.productType && (
                    <Button
                      variant="gold"
                      onClick={() => openQuick(p.productType!)}
                      block
                    >
                      {p.quickLabel}
                    </Button>
                  )}
                  <Button
                    variant={p.primaryVariant ?? "ghost"}
                    onClick={() => router.push(p.primaryPath)}
                    block
                  >
                    {p.primaryLabel}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <QuickProductModal
        isOpen={quickOpen}
        onClose={() => setQuickOpen(false)}
        initialProduct={activeProduct}
      />
    </>
  );
}

