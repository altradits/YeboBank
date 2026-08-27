"use client";

import React, { useRef } from "react";

type Variant = "primary" | "gold" | "lime" | "ghost";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean;
  onDark?: boolean;
}

export default function Button({
  variant = "primary",
  block = false,
  onDark = false,
  className = "",
  children,
  onClick,
  ...rest
}: Props) {
  const ref = useRef<HTMLButtonElement>(null);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const btn = ref.current;
    if (btn && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const r = document.createElement("span");
      r.className = "ripple";
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      r.style.width = r.style.height = `${size}px`;
      r.style.left = `${e.clientX - rect.left - size / 2}px`;
      r.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(r);
      setTimeout(() => r.remove(), 600);
    }
    onClick?.(e);
  }

  const classes = [
    "btn",
    `btn-${variant}`,
    block ? "btn-block" : "",
    onDark ? "on-dark" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button ref={ref} className={classes} onClick={handleClick} {...rest}>
      {children}
    </button>
  );
}
