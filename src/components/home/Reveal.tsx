"use client";

// Fades a block in the first time it scrolls into view. Content is visible by
// default and only hidden once the observer confirms it starts off-screen, so
// no-JS visitors, crawlers and screenshots always see everything.

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

export function Reveal({
  as: Tag = "div",
  className = "",
  stagger = false,
  children,
  ...rest
}: {
  as?: ElementType;
  className?: string;
  /** Children reveal one after another (`.stg` + `.rv-item`). */
  stagger?: boolean;
  children: ReactNode;
  id?: string;
  "aria-labelledby"?: string;
  "aria-label"?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [pre, setPre] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let seen = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          seen = true;
          setPre(false);
          io.disconnect();
        } else if (!seen) {
          setPre(true);
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const base = stagger ? "stg" : "rv";
  return (
    <Tag ref={ref} className={`${base} ${className}${pre ? " pre" : ""}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
