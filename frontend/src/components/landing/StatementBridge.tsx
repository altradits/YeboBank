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

        {/* ── Logo Animation Column (3D Depth Perspective & Vertical Bounce Assembly) ── */}
        <div className="statement-anim-col" aria-hidden="true">
          <svg
            viewBox="-48 -4 96 66"
            className="logo-auto-assemble-svg logo-3d-scene"
            style={{
              height: textHeight ? `${textHeight}px` : "clamp(120px, 16vw, 220px)",
              width: "auto",
            }}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Rich Kenyan 3D Gold Metallic Gradient */}
              <linearGradient id={`${uid}gold`} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFF4B8" />
                <stop offset="0.25" stopColor="#E5B83B" />
                <stop offset="0.65" stopColor="#D4A018" />
                <stop offset="1" stopColor="#7A5300" />
              </linearGradient>

              {/* Embossed Inner Leaf Highlights */}
              <linearGradient id={`${uid}goldLight`} x1="24" y1="8" x2="24" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFF8D6" />
                <stop offset="0.5" stopColor="#E5B83B" />
                <stop offset="1" stopColor="#966C06" />
              </linearGradient>

              {/* Ambient 3D Volumetric Glow */}
              <radialGradient id={`${uid}glow`} cx="24" cy="24" r="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#D4A018" stopOpacity="0.45" />
                <stop offset="0.7" stopColor="#D4A018" stopOpacity="0.15" />
                <stop offset="1" stopColor="#D4A018" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* 0. 3D Dynamic Ground Contact Shadow (Lowered with clear air space below ring) */}
            <ellipse
              cx="24"
              cy="58"
              rx="18"
              ry="3.5"
              fill="rgba(110, 75, 0, 0.22)"
              className="auto-3d-ground-shadow"
            />

            <g className="logo-3d-group">
              {/* 1. Ambient Background Glow */}
              <circle
                cx="24"
                cy="24"
                r="24"
                fill={`url(#${uid}glow)`}
                className="auto-part auto-glow"
              />

              {/* 2. Outer Golden Coin Ring (3D Bevel & Vertical Bounce) */}
              <circle
                cx="24"
                cy="24"
                r="22.75"
                stroke={`url(#${uid}gold)`}
                strokeWidth="2.8"
                className="auto-part auto-ring auto-ring-3d"
              />

              {/* 3. Left Wing / Curved Laurel Leaf (3D Tilt Assembly) */}
              <path
                d="M24 38C16 34 11 27 11 18C16 18 21 21 24 26C24 30 24 34 24 38Z"
                fill={`url(#${uid}gold)`}
                className="auto-part auto-wing-left auto-wing-3d"
              />

              {/* 4. Right Wing / Curved Laurel Leaf (3D Tilt Assembly) */}
              <path
                d="M24 38C32 34 37 27 37 18C32 18 27 21 24 26C24 30 24 34 24 38Z"
                fill={`url(#${uid}gold)`}
                className="auto-part auto-wing-right auto-wing-3d"
              />

              {/* 5. Central Diamond Seed Core (3D Z-Depth Snap) */}
              <path
                d="M24 10L28 19L24 28L20 19L24 10Z"
                fill={`url(#${uid}goldLight)`}
                className="auto-part auto-core auto-core-3d"
              />

              {/* 6. Apex Crown Beacon Star (3D Apex Specular Point) */}
              <circle
                cx="24"
                cy="10"
                r="2.2"
                fill="#FFF8D6"
                className="auto-part auto-crown auto-crown-3d"
              />
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}
