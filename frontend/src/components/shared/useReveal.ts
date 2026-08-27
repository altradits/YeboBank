"use client";

import { useEffect, useRef } from "react";

// Attach the returned ref to any element with the `reveal` (or bars/nodes/map)
// class; it gains `.in` once it scrolls into view.
export function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.16) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return ref;
}

// Reveal everything with the `reveal` class inside a container (used on the
// landing page so we don't need a ref per element).
export function useRevealAll() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.16 }
    );
    document
      .querySelectorAll(".reveal, .bars, .nodes, .map")
      .forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
