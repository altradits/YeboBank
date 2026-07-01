"use client";

import React, { useEffect } from "react";
import { useRevealAll } from "@/components/ui/useReveal";
import Ticker from "@/components/landing/Ticker";
import SiteNav from "@/components/landing/SiteNav";
import Hero from "@/components/landing/Hero";
import FeatureSections from "@/components/landing/FeatureSections";
import { Lightning, Trust } from "@/components/landing/Highlights";
import Converter from "@/components/landing/Converter";
import { ClosingCTA, SiteFooter } from "@/components/landing/Footer";

export default function HomePage() {
  useRevealAll();
  useEffect(() => {
    document.body.classList.add("landing-page");
    return () => document.body.classList.remove("landing-page");
  }, []);
  return (
    <div style={{ '--maxw': '1680px' } as React.CSSProperties}>
      <div className="landing-above-fold">
        <Ticker />
        <SiteNav />
        <Hero />
      </div>
      <FeatureSections />
      <Lightning />
      <Trust />
      <Converter />
      <ClosingCTA />
      <SiteFooter />
    </div>
  );
}
