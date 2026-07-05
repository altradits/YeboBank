"use client";

import { useId } from "react";

interface Props {
  size?: number;
  className?: string;
}

export default function LogoMark({ size = 34, className }: Props) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Deep navy background — NW dark → SE slightly lighter */}
        <linearGradient id={`${uid}bg`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop style={{ stopColor: "var(--ink, #080D1E)" }}/>
          <stop offset="1" style={{ stopColor: "var(--ink, #111828)", stopOpacity: 0.85 }}/>
        </linearGradient>
        {/* Gold: bright crown at peak → brand gold → deep amber at base */}
        <linearGradient id={`${uid}g`} x1="20" y1="11" x2="20" y2="31" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F0CC58"/>
          <stop offset="0.58" stopColor="#C49020"/>
          <stop offset="1" stopColor="#8A5E08"/>
        </linearGradient>
        {/* Subtle gold glow centered at the peak */}
        <radialGradient id={`${uid}glow`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
          gradientTransform="translate(20 11) scale(22 18)">
          <stop stopColor="#C49020" stopOpacity=".20"/>
          <stop offset="1" stopColor="#C49020" stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* Background */}
      <rect width="40" height="40" rx="9" fill={`url(#${uid}bg)`}/>
      {/* Gold glow at peak */}
      <rect width="40" height="40" rx="9" fill={`url(#${uid}glow)`}/>

      {/* Upward chevron — growth mark */}
      <path
        d="M8 31L20 11L32 31"
        stroke={`url(#${uid}g)`}
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Peak cap — solid gold dot anchoring the apex */}
      <circle cx="20" cy="11" r="3" fill="#F0CC58"/>
    </svg>
  );
}
