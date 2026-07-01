"use client";

import React from "react";
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
  return (
    <div style={{ '--maxw': '1400px' } as React.CSSProperties}>
      <Ticker />
      <SiteNav />
      <Hero />
      <FeatureSections />
      <Lightning />
      <Trust />
      <Converter />
      <ClosingCTA />
      <SiteFooter />
    </div>
  );
}
