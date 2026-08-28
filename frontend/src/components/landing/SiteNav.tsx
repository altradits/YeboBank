"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import LogoMark from "@/components/shared/LogoMark";
import QuickProductModal, { type ProductType } from "./QuickProductModal";

interface NavLink {
  id: string;
  label: string;
  action: "modal" | "anchor";
  icon: string;
  href?: string;
  product?: ProductType;
}

const NAV_LINKS: NavLink[] = [
  { id: "send", label: "Send", action: "modal", icon: "ti-send", product: "send" },
  { id: "save", label: "Save", action: "modal", icon: "ti-lock", product: "savings" },
  { id: "deposit", label: "Deposit", action: "modal", icon: "ti-device-mobile", product: "mpesa" },
  { id: "pool", label: "Pool", action: "modal", icon: "ti-users", product: "chama" },
  { id: "invest", label: "Invest", action: "modal", icon: "ti-trending-up", product: "invest" },
  { id: "convert", label: "Convert", action: "anchor", icon: "ti-exchange", href: "#convert" },
];

export default function SiteNav() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductType>("savings");

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 30);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const launchProductModal = (product: ProductType) => {
    setSelectedProduct(product);
    setMobileMenuOpen(false);
    setQuickModalOpen(true);
  };

  return (
    <>
      <nav className={`nav ${scrolled ? "nav-scrolled" : ""}`}>
        <div className="wrap nav-wrap">
          {/* Brand Logo */}
          <Link href="/" className="brand">
            <LogoMark size={34} />
            <span className="brand-text">YeboBank</span>
          </Link>

          {/* Verb-Based Primary Navigation Links */}
          <div className="navlinks">
            {NAV_LINKS.map((link) => {
              if (link.action === "modal" && link.product) {
                return (
                  <button
                    key={link.id}
                    type="button"
                    className="nav-link-direct"
                    onClick={() => launchProductModal(link.product!)}
                  >
                    {link.label}
                  </button>
                );
              }
              return (
                <a key={link.id} href={link.href} className="nav-link-direct">
                  {link.label}
                </a>
              );
            })}
          </div>

          {/* Action CTAs */}
          <div className="navactions">
            {/* Primary Onboarding CTA */}
            <button
              type="button"
              className="nav-sell-btn"
              onClick={() => router.push("/register")}
            >
              <span>Open Account</span>
            </button>

            {/* Sign In */}
            <button
              type="button"
              className="nav-signin-btn"
              onClick={() => router.push("/login")}
            >
              Sign In
            </button>

            {/* Mobile Hamburger */}
            <button
              type="button"
              className="nav-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              <i className={`ti ${mobileMenuOpen ? "ti-x" : "ti-menu-2"}`} />
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Menu */}
        {mobileMenuOpen && (
          <div className="mobile-nav-panel">
            <div className="mobile-nav-products">
              <span className="mobile-nav-label">Core Features</span>
              {NAV_LINKS.map((link) => {
                const handleClick = () => {
                  if (link.action === "modal" && link.product) {
                    launchProductModal(link.product);
                  } else if (link.action === "anchor" && link.href) {
                    setMobileMenuOpen(false);
                    router.push("/" + link.href);
                  }
                };

                return (
                  <button
                    key={link.id}
                    className="mobile-prod-item"
                    onClick={handleClick}
                  >
                    <i className={`ti ${link.icon}`} />
                    <div className="mobile-prod-text">
                      <div className="mobile-prod-name">
                        {link.label}
                      </div>
                    </div>
                    <i className="ti ti-chevron-right mobile-prod-arr" />
                  </button>
                );
              })}
            </div>

            <div className="mobile-nav-footer">
              <button
                className="btn btn-gold btn-block"
                onClick={() => router.push("/register")}
              >
                ⚡ Open Free Account
              </button>
              <button
                className="btn btn-ghost btn-block"
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push("/login");
                }}
              >
                Sign In to Dashboard
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Global Quick Product Launcher Modal */}
      <QuickProductModal
        isOpen={quickModalOpen}
        onClose={() => setQuickModalOpen(false)}
        initialProduct={selectedProduct}
      />
    </>
  );
}
