"use client";

import Image from "next/image";
import { PointerEvent, useEffect, useRef } from "react";

const categories = [
  { className: "top", label: "IT support" },
  { className: "left", label: "Networks + M365" },
  { className: "right", label: "Security + backups" },
  { className: "bottom", label: "Web + automation" },
] as const;

export function HeroVisual() {
  const visual = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const enabled = useRef(false);

  useEffect(() => {
    enabled.current = !window.matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)").matches;
    return () => { if (frame.current) cancelAnimationFrame(frame.current); };
  }, []);

  function move(event: PointerEvent<HTMLDivElement>) {
    if (!enabled.current || !visual.current) return;
    const rect = visual.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 16;
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      visual.current?.style.setProperty("--hero-x", `${x.toFixed(2)}px`);
      visual.current?.style.setProperty("--hero-y", `${y.toFixed(2)}px`);
    });
  }

  function reset() {
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      visual.current?.style.setProperty("--hero-x", "0px");
      visual.current?.style.setProperty("--hero-y", "0px");
    });
  }

  return <div aria-hidden="true" className="hero-visual" data-testid="hero-visual" onPointerLeave={reset} onPointerMove={move} ref={visual}>
    <div className="hero-visual__orbit hero-visual__orbit--one" />
    <div className="hero-visual__orbit hero-visual__orbit--two" />
    <div className="hero-visual__core">
      <Image alt="" className="hero-visual__brand-mark" height={512} priority src="/brand/boomotech-mark.png" width={512} />
      <p>Support, secure,<br /><strong>improve and build.</strong></p>
    </div>
    {categories.map((category) => <div className={`hero-visual__chip hero-visual__chip--${category.className}`} key={category.label}>{category.label}</div>)}
  </div>;
}
