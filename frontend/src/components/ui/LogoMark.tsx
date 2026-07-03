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
        <linearGradient id={`${uid}a`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#050D08"/>
          <stop offset="1" stopColor="#0F2618"/>
        </linearGradient>
        <linearGradient id={`${uid}b`} x1="8" y1="8" x2="31" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E0BC48"/>
          <stop offset="1" stopColor="#9C6C14"/>
        </linearGradient>
        <radialGradient id={`${uid}c`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
          gradientTransform="translate(31 7) scale(20)">
          <stop stopColor="#C9A84C" stopOpacity=".22"/>
          <stop offset="1" stopColor="#C9A84C" stopOpacity="0"/>
        </radialGradient>
      </defs>
      {/* Dark forest gradient background */}
      <rect width="40" height="40" rx="9" fill={`url(#${uid}a)`}/>
      {/* Ambient gold glow — top-right */}
      <rect width="40" height="40" rx="9" fill={`url(#${uid}c)`}/>
      {/* Y — left arm */}
      <path d="M8 7.5L20 19" stroke={`url(#${uid}b)`} strokeWidth="4.5" strokeLinecap="round"/>
      {/* Y — right arm */}
      <path d="M32 7.5L20 19" stroke={`url(#${uid}b)`} strokeWidth="4.5" strokeLinecap="round"/>
      {/* Y — stem */}
      <path d="M20 19L20 32.5" stroke={`url(#${uid}b)`} strokeWidth="4.5" strokeLinecap="round"/>
      {/* Junction node — lime ring + centre dot (the Bitcoin savings node) */}
      <circle cx="20" cy="19" r="4" fill={`url(#${uid}a)`} stroke="#96C244" strokeWidth="2"/>
      <circle cx="20" cy="19" r="1.2" fill="#96C244"/>
    </svg>
  );
}
