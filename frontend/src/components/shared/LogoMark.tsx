"use client";

import React, { useId } from "react";

interface Props {
  size?: number;
  className?: string;
  animated?: boolean;
}

export default function LogoMark({ size = 36, className = "", animated = false }: Props) {
  const uid = useId().replace(/:/g, "");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`yebo-logo-svg ${animated ? "yebo-logo-animated" : ""} ${className}`}
      aria-hidden="true"
      focusable="false"
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
        <radialGradient
          id={`${uid}glow`}
          cx="24"
          cy="24"
          r="22"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#D4A018" stopOpacity="0.25" />
          <stop offset="1" stopColor="#D4A018" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient background glow */}
      <circle cx="24" cy="24" r="22" fill={`url(#${uid}glow)`} />

      {/* Outer Golden Coin Ring */}
      <circle
        cx="24"
        cy="24"
        r="21"
        stroke={`url(#${uid}gold)`}
        strokeWidth="2.2"
        className="yebo-logo-ring"
      />

      <g className="yebo-logo-core" style={{ transformOrigin: "center" }}>
        {/* Left Wing / Curved Leaf */}
        <path
          d="M24 38C16 34 11 27 11 18C16 18 21 21 24 26C24 30 24 34 24 38Z"
          fill={`url(#${uid}gold)`}
        />

        {/* Right Wing / Curved Leaf */}
        <path
          d="M24 38C32 34 37 27 37 18C32 18 27 21 24 26C24 30 24 34 24 38Z"
          fill={`url(#${uid}gold)`}
        />

        {/* Central Ascending Seed / Diamond Pillar */}
        <path
          d="M24 10L28 19L24 28L20 19L24 10Z"
          fill={`url(#${uid}goldLight)`}
        />

        {/* Apex Crown Seed Beacon */}
        <circle cx="24" cy="10" r="2.2" fill="#FFF2B2" />
      </g>
    </svg>
  );
}
