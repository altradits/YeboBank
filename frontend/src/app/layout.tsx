import type { Metadata } from "next";
import "@fontsource-variable/playfair-display";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { RateProvider } from "@/lib/rate-context";

export const metadata: Metadata = {
  title: "YeboBank — Save in Bitcoin. Spend in shillings.",
  description:
    "An open-source Bitcoin savings bank for Kenya. Earn interest in sats, top up and cash out with M-Pesa, and watch your money stop shrinking to inflation.",
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
        <RateProvider>{children}</RateProvider>
      </body>
    </html>
  );
}
