"use client";

import React, { useEffect, useRef, useState, useId } from "react";

const CURRENCIES = [
  { id: "etb", word: "birr." },
  { id: "kes", word: "shillings." },
  { id: "zaad", word: "zaad." },
];

export default function StatementBridge() {
  const uid = useId().replace(/:/g, "");
  const textRef = useRef<HTMLHeadingElement>(null);
  const [textHeight, setTextHeight] = useState<number | null>(null);
  const [currIdx, setCurrIdx] = useState(0);

  // Measure text height based on the permanent baseline geometry
  useEffect(() => {
    if (!textRef.current) return;
    const updateHeight = () => {
      if (textRef.current) {
        setTextHeight(textRef.current.offsetHeight);
      }
    };

    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(textRef.current);
    window.addEventListener("resize", updateHeight);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  // Endless loop alternating only the currency word (Ethiopia: birr, Kenya: shillings, Somalia: zaad)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrIdx((prev) => (prev + 1) % CURRENCIES.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const activeCurrency = CURRENCIES[currIdx];

  return (
    <section className="statement-sec">
      <div className="wrap statement-clean-wrap">
        {/* ── Text Column (Permanent constant position locked to "birr." geometry) ── */}
        <div className="statement-copy-col">
          <h2 className="statement-h2" ref={textRef}>
            <div className="sh-line">
              <span className="sh-verb">Save in</span>
              <span className="sh-highlight gold">sats.</span>
            </div>
            <div className="sh-line">
              <span className="sh-verb">Spend in</span>
              <span className="sh-currency-slot">
                {/* Structural anchor permanently locking the entire layout coordinates to "birr." */}
                <span className="sh-currency-ghost" aria-hidden="true">
                  birr.
                </span>
                {/* Independent overlay word that animates without affecting any other elements */}
                <span
                  className="sh-highlight forest sh-currency-word"
                  key={activeCurrency.id}
                >
                  {activeCurrency.word}
                </span>
              </span>
            </div>
          </h2>
        </div>

        {/* ── Logo Animation Column (Constant coordinates & exact matching height) ── */}
        <div className="statement-anim-col" aria-hidden="true">
          <svg
            viewBox="-48 0 96 48"
            className="logo-auto-assemble-svg"
            style={{
              height: textHeight ? `${textHeight}px` : "clamp(120px, 16vw, 220px)",
              width: "auto",
            }}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Rich Kenyan Gold Gradient */}
              <linearGradient id={`${uid}gold`} x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F9DF7B" />
                <stop offset="0.45" stopColor="#D4A018" />
                <stop offset="1" stopColor="#8C6200" />
              </linearGradient>

              {/* Inner Leaf Highlights */}
              <linearGradient id={`${uid}goldLight`} x1="24" y1="8" x2="24" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFF2B2" />
                <stop offset="0.6" stopColor="#E5B83B" />
                <stop offset="1" stopColor="#A3760B" />
              </linearGradient>

              {/* Ambient Halo Glow */}
              <radialGradient id={`${uid}glow`} cx="24" cy="24" r="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#D4A018" stopOpacity="0.35" />
                <stop offset="1" stopColor="#D4A018" stopOpacity="0" />
              </radialGradient>
            </defs>

            <g transform="translate(0, 0)">
              {/* 1. Ambient Background Glow */}
              <circle
                cx="24"
                cy="24"
                r="24"
                fill={`url(#${uid}glow)`}
                className="auto-part auto-glow"
              />

              {/* 2. Outer Golden Coin Ring (Top at y=1.25, bottom at y=46.75 -> Matches viewBox height) */}
              <circle
                cx="24"
                cy="24"
                r="22.75"
                stroke={`url(#${uid}gold)`}
                strokeWidth="2.5"
                className="auto-part auto-ring"
              />

              {/* 3. Left Wing / Curved Laurel Leaf */}
              <path
                d="M24 38C16 34 11 27 11 18C16 18 21 21 24 26C24 30 24 34 24 38Z"
                fill={`url(#${uid}gold)`}
                className="auto-part auto-wing-left"
              />

              {/* 4. Right Wing / Curved Laurel Leaf */}
              <path
                d="M24 38C32 34 37 27 37 18C32 18 27 21 24 26C24 30 24 34 24 38Z"
                fill={`url(#${uid}gold)`}
                className="auto-part auto-wing-right"
              />

              {/* 5. Central Diamond Seed Core */}
              <path
                d="M24 10L28 19L24 28L20 19L24 10Z"
                fill={`url(#${uid}goldLight)`}
                className="auto-part auto-core"
              />

              {/* 6. Apex Crown Beacon Star */}
              <circle
                cx="24"
                cy="10"
                r="2.2"
                fill="#FFF2B2"
                className="auto-part auto-crown"
              />
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}
