import type { Metadata } from "next";
import "@fontsource-variable/playfair-display";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { RateProvider } from "@/lib/rate-context";
import DemoBanner from "@/components/DemoBanner";

export const metadata: Metadata = {
  title: "YeboBank — Demo (test sats only, no real money)",
  description:
    "Open-source demo of a Bitcoin savings concept for Kenya on test networks. Simulated interest, test sats only, no real money.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="light">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#F8FAF8" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.7.0/dist/tabler-icons.min.css"
        />
      </head>
      <body>
        <DemoBanner />
        <RateProvider>{children}</RateProvider>
      </body>
    </html>
  );
}
