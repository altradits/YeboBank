"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import LogoMark from "@/components/ui/LogoMark";
import QuickProductModal, { type ProductType } from "./QuickProductModal";

interface NavProductItem {
  id: ProductType;
  label: string;
  badge?: string;
  tagline: string;
  metric: string;
  anchor: string;
  actionText: string;
  icon: string;
}

const NAV_PRODUCTS: NavProductItem[] = [
  {
    id: "savings",
    label: "Savings Vault",
    badge: "5.2% APY",
    tagline: "Lock savings in satoshis and earn ~5.2% real yield.",
    metric: "0% Lockup Penalty",
    anchor: "#save",
    actionText: "⚡ Start Saving Now",
    icon: "ti-lock",
  },
  {
    id: "mpesa",
    label: "M-Pesa Rails",
    badge: "0% STK",
    tagline: "Deposit Kenyan shillings directly into sats from your phone.",
    metric: "15s STK Push",
    anchor: "#mpesa",
    actionText: "📱 Deposit via M-Pesa",
    icon: "ti-device-mobile",
  },
  {
    id: "chama",
    label: "Chama Pools",
    badge: "Multisig",
    tagline: "Pool group savings with transparent Bitcoin multi-signature.",
    metric: "Joint Voting",
    anchor: "#chama",
    actionText: "👥 Join / Start Chama",
    icon: "ti-users",
  },
  {
    id: "agent",
    label: "Agent Network",
    badge: "47 Counties",
    tagline: "Cash in and cash out at local duka agents nationwide.",
    metric: "Offline Ready",
    anchor: "#agents",
    actionText: "📍 Find Nearest Agent",
    icon: "ti-cash",
  },
  {
    id: "lightning",
    label: "Lightning Pay",
    badge: "< 3s Global",
    tagline: "Instant sub-cent Bitcoin transactions globally.",
    metric: "Free Addresses",
    anchor: "#lightning",
    actionText: "⚡ Send via Lightning",
    icon: "ti-bolt",
  },
  {
    id: "invest",
    label: "Mlinzi Fund",
    badge: "Private",
    tagline: "Friends & family capital stewardship and monthly statements.",
    metric: "+20% p.a. Target",
    anchor: "#invest",
    actionText: "📈 Request Allocation",
    icon: "ti-trending-up",
  },
];

export default function SiteNav() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(true);
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductType>("savings");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isLight = document.documentElement.dataset.theme === "light";
    setDark(!isLight);

    function onScroll() {
      setScrolled(window.scrollY > 30);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProductsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleTheme() {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("yebo-theme", next); } catch { }
    setDark(!dark);
  }

  const launchProductModal = (product: ProductType) => {
    setSelectedProduct(product);
    setProductsOpen(false);
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

          {/* Direct Selling Navigation Links */}
          <div className="navlinks">
            {/* Products Mega-Menu Trigger */}
            <div className="nav-dropdown-wrap" ref={dropdownRef}>
              <button
                type="button"
                className={`nav-link-btn ${productsOpen ? "active" : ""}`}
                onClick={() => setProductsOpen(!productsOpen)}
                aria-expanded={productsOpen}
                aria-haspopup="menu"
              >
                <span>Products &amp; Yield</span>
                <i className={`ti ti-chevron-${productsOpen ? "up" : "down"} nav-caret`} />
              </button>

              {/* Mega Dropdown Panel */}
              {productsOpen && (
                <div className="nav-mega-menu" role="menu">
                  <div className="nmm-header">
                    <span className="nmm-tagline">Select a product to launch immediately:</span>
                  </div>
                  <div className="nmm-grid">
                    {NAV_PRODUCTS.map((prod) => (
                      <div key={prod.id} className="nmm-card">
                        <div className="nmm-card-top">
                          <div className="nmm-icon-wrap">
                            <i className={`ti ${prod.icon}`} />
                          </div>
                          <div className="nmm-title-col">
                            <div className="nmm-title-row">
                              <span className="nmm-title">{prod.label}</span>
                              {prod.badge && <span className="nmm-badge">{prod.badge}</span>}
                            </div>
                            <span className="nmm-metric">{prod.metric}</span>
                          </div>
                        </div>
                        <p className="nmm-desc">{prod.tagline}</p>
                        <div className="nmm-action-row">
                          <button
                            type="button"
                            className="nmm-action-btn"
                            onClick={() => launchProductModal(prod.id)}
                          >
                            {prod.actionText}
                          </button>
                          <a
                            href={prod.anchor}
                            className="nmm-explore-link"
                            onClick={() => setProductsOpen(false)}
                          >
                            Details →
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Direct 1-Click Fast Links */}
            <button
              type="button"
              className="nav-link-direct"
              onClick={() => launchProductModal("savings")}
            >
              Vault (5.2%)
            </button>

            <button
              type="button"
              className="nav-link-direct"
              onClick={() => launchProductModal("mpesa")}
            >
              M-Pesa STK
            </button>

            <button
              type="button"
              className="nav-link-direct"
              onClick={() => launchProductModal("chama")}
            >
              Chamas
            </button>

            <button
              type="button"
              className="nav-link-direct"
              onClick={() => launchProductModal("agent")}
            >
              47 Counties
            </button>

            <a href="#convert" className="nav-link-direct">
              Live Rates
            </a>
          </div>

          {/* Action CTAs */}
          <div className="navactions">
            {/* Theme switch */}
            <button
              className="nav-theme-toggle"
              onClick={toggleTheme}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <i className={`ti ${dark ? "ti-sun" : "ti-moon"}`} />
            </button>

            {/* Quick Save CTA */}
            <button
              type="button"
              className="nav-sell-btn"
              onClick={() => launchProductModal("savings")}
            >
              <span>Save</span>
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
              <span className="mobile-nav-label">Instant Product Actions</span>
              {NAV_PRODUCTS.map((prod) => (
                <button
                  key={prod.id}
                  className="mobile-prod-item"
                  onClick={() => launchProductModal(prod.id)}
                >
                  <i className={`ti ${prod.icon}`} />
                  <div className="mobile-prod-text">
                    <div className="mobile-prod-name">
                      {prod.label} <span className="mobile-prod-badge">{prod.badge}</span>
                    </div>
                    <div className="mobile-prod-desc">{prod.actionText}</div>
                  </div>
                  <i className="ti ti-chevron-right mobile-prod-arr" />
                </button>
              ))}
            </div>

            <div className="mobile-nav-footer">
              <button
                className="btn btn-gold btn-block"
                onClick={() => launchProductModal("savings")}
              >
                ⚡ Start Saving in Sats
              </button>
              <button
                className="btn btn-ghost btn-block"
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push("/login");
                }}
              >
                Sign In to Member Dashboard
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

