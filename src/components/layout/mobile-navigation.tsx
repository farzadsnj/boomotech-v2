"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { site } from "@/content/site";
import { ChatBookingButton } from "./chat-booking-button";
import { NavigationLink } from "./navigation-link";

export function MobileNavigation() {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const close = (event: Event) => {
      const details = detailsRef.current;
      if (!details?.open) return;
      if (event instanceof KeyboardEvent && event.key === "Escape") { details.open = false; details.querySelector("summary")?.focus(); }
      if (event instanceof PointerEvent && !details.contains(event.target as Node)) details.open = false;
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    return () => { document.removeEventListener("keydown", close); document.removeEventListener("pointerdown", close); };
  }, []);

  return (
    <details className="mobile-nav" ref={detailsRef}>
      <summary aria-label="Toggle navigation">
        <span className="mobile-nav__label">Menu</span>
        <span aria-hidden="true" className="menu-lines"><i /><i /></span>
      </summary>
      <nav aria-label="Mobile primary">
        {site.navigation.map((item) => <NavigationLink key={item.href} href={item.href}>{item.label}<ArrowIcon diagonal /></NavigationLink>)}
        <ChatBookingButton mobile />
      </nav>
    </details>
  );
}
