"use client";

import React, { useEffect } from "react";
import { useRevealAll } from "@/components/ui/useReveal";
import SiteNav from "@/components/landing/SiteNav";
import Hero from "@/components/landing/Hero";
import FeatureSections from "@/components/landing/FeatureSections";
import { Lightning, Trust } from "@/components/landing/Highlights";
import UserPaths from "@/components/landing/UserPaths";
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
        <SiteNav />
        <Hero />
      </div>
      <FeatureSections />
      <Lightning />
      <Trust />
      <UserPaths />
      <Converter />
      <ClosingCTA />
      <SiteFooter />
    </div>
  );
}
