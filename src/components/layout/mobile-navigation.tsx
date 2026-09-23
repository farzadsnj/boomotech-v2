"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { site } from "@/content/site";
import { NavigationLink } from "./navigation-link";

export function MobileNavigation() {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const details = detailsRef.current;
    if (!details) return;

    const close = (restoreFocus = false) => {
      if (!details.open) return;
      details.open = false;
      if (restoreFocus) details.querySelector("summary")?.focus();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !details.contains(event.target)) close();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return (
    <details className="mobile-nav" ref={detailsRef}>
      <summary aria-label="Toggle navigation">
        <span className="mobile-nav__label">Menu</span>
        <span aria-hidden="true" className="menu-lines"><i /><i /></span>
      </summary>
      <nav aria-label="Mobile primary">
        {site.navigation.map((item) => <NavigationLink key={item.href} href={item.href}>{item.label}<ArrowIcon diagonal /></NavigationLink>)}
        <NavigationLink className="mobile-nav__cta" href="/book">Explore consultation<ArrowIcon diagonal /></NavigationLink>
      </nav>
    </details>
  );
}
