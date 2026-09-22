"use client";

import { useEffect, useRef } from "react";

type Props = { children: React.ReactNode; className?: string; delay?: 0 | 1 | 2 | 3 };

export function Reveal({ children, className = "", delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      element.classList.add("is-visible");
      return;
    }
    element.classList.add("motion-ready");
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.classList.add("is-visible");
        observer.disconnect();
      }
    }, { rootMargin: "0px 0px -8%", threshold: 0.08 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div className={`reveal reveal--delay-${delay} ${className}`.trim()} ref={ref}>{children}</div>;
}
