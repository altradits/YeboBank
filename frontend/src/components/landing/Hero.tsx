"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

interface Scene {
  id: string;
  src: string;
  verb: string;
  accentClass: string;
  feature: string;
  ctaText: string;
  ctaAction: "deposit" | "explore";
}

const SCENES: Scene[] = [
  {
    id: "dine",
    src: "/images/travel-food.jpg",
    verb: "Dine.",
    accentClass: "gold",
    feature: "Pay for food and coffee using M-Pesa anywhere in East Africa with zero extra fees.",
    ctaText: "Deposit",
    ctaAction: "deposit",
  },
  {
    id: "travel",
    src: "/images/travel-transit.jpg",
    verb: "Travel.",
    accentClass: "grn",
    feature: "Pay for your bus, train, and matatu rides directly from your phone in seconds.",
    ctaText: "Send",
    ctaAction: "deposit",
  },
  {
    id: "stay",
    src: "/images/travel-shelter.jpg",
    verb: "Stay.",
    accentClass: "gold",
    feature: "Book and pay for hotels and lodges across Kenya, Ethiopia, and Somalia without losing money to border currency brokers.",
    ctaText: "Explore",
    ctaAction: "explore",
  },
];

export default function Hero() {
  const router = useRouter();
  const [activeIdx, setActiveIdx] = useState(0);

  // Smoothly rotate scenes every 5.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % SCENES.length);
    }, 5500);
    return () => clearInterval(interval);
  }, []);

  const activeScene = SCENES[activeIdx];

  const handleCtaClick = () => {
    if (activeScene.ctaAction === "deposit") {
      const hub = document.getElementById("corridor-hub");
      if (hub) {
        hub.scrollIntoView({ behavior: "smooth" });
      } else {
        router.push("/login?redirect=/deposit");
      }
    } else {
      router.push("/login?redirect=/dashboard");
    }
  };

  return (
    <header className="hero hero--uncluttered">
      {/* ── Native Layered Image Cross-Fade Background ── */}
      <div className="hero-fader-bg-container" aria-hidden="true">
        {SCENES.map((scene, idx) => (
          <div
            key={scene.id}
            className={`hero-fader-slide ${idx === activeIdx ? "active" : ""}`}
            style={{
              backgroundImage: `url(${scene.src})`,
            }}
          />
        ))}
        {/* Soft luminous overlay for pristine typography contrast */}
        <div className="hero-video-overlay" />
      </div>

      <div className="wrap hero-clean-wrap">
        <div className="hero-uncluttered-stage">
          {/* ── Dominant One-Word Verb Headline ── */}
          <h1 className="hero-verb-h" key={activeScene.id}>
            <span className={`hero-verb-word ${activeScene.accentClass}`}>
              {activeScene.verb}
            </span>
          </h1>

          {/* ── Matching Simple Feature Sentence ── */}
          <p className="hero-verb-sub" key={`sub-${activeScene.id}`}>
            {activeScene.feature}
          </p>

          {/* ── Single Dominant Call To Action ── */}
          <div className="hero-verb-cta">
            <Button variant="gold" onClick={handleCtaClick}>
              {activeScene.ctaText}
            </Button>
            <Button variant="ghost" onClick={() => router.push("/login?redirect=/dashboard")}>
              Explore
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
