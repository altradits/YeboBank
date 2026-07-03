import type { Metadata } from "next";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { RateProvider } from "@/lib/rate-context";

// Syne: geometric display with distinctive letterforms — premium fintech feel
const display = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});
// DM Sans: clean optical-size sans — excellent legibility at body sizes
const body = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});
// JetBrains Mono: developer-grade monospace for sats, addresses, hashes
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "YeboBank — Save in Bitcoin. Spend in shillings.",
  description:
    "An open-source Bitcoin savings bank for Kenya. Earn interest in sats, top up and cash out with M-Pesa, and watch your money stop shrinking to inflation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Resolve theme before first paint — prevents flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html:
          `(function(){try{var t=localStorage.getItem('yebo-theme');` +
          `if(!t){t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';}` +
          `document.documentElement.dataset.theme=t;}catch(e){}})();`
        }} />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#050D08" />
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
