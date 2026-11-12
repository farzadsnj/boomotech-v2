"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    let firstFrame = 0;
    let secondFrame = 0;
    let observer: IntersectionObserver | undefined;

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        const elements = [...document.querySelectorAll<HTMLElement>(".reveal:not(.is-visible)")];
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
          elements.forEach((element) => element.classList.remove("reveal-pending"));
          return;
        }
        observer = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("is-visible");
            observer?.unobserve(entry.target);
          }
        }, { rootMargin: "0px 0px -8%", threshold: 0.08 });
        elements.forEach((element) => {
          const bounds = element.getBoundingClientRect();
          const inInitialViewport = bounds.bottom >= 0 && bounds.top <= window.innerHeight;
          if (inInitialViewport) {
            element.classList.add("is-visible");
            return;
          }
          element.classList.add("reveal-pending");
          observer?.observe(element);
        });
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      observer?.disconnect();
      document.querySelectorAll<HTMLElement>(".reveal-pending").forEach((element) => element.classList.remove("reveal-pending"));
    };
  }, [pathname]);

  return null;
}
