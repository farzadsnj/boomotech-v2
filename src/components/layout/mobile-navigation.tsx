"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { ChatBookingButton } from "./chat-booking-button";
import { NavigationLink } from "./navigation-link";
import { ArticleIcon } from "@/components/ui/article-icon";

function AccountIcon() {
  return <svg aria-hidden="true" className="account-icon" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.7-4 3-6 7-6s6.3 2 7 6" /></svg>;
}

export function MobileNavigation({ shopEnabled = false }: { shopEnabled?: boolean }) {
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

  useEffect(() => {
    const closeForBooking = () => { if (detailsRef.current) detailsRef.current.open = false; };
    window.addEventListener("boomotech:open-booking", closeForBooking);
    return () => window.removeEventListener("boomotech:open-booking", closeForBooking);
  }, []);

  return (
    <details className="mobile-nav" ref={detailsRef}>
      <summary aria-label="Toggle navigation">
        <span className="mobile-nav__label">Menu</span>
        <span aria-hidden="true" className="menu-lines"><i /><i /></span>
      </summary>
      <nav aria-label="Mobile primary">
        <NavigationLink href="/services"><span className="mobile-nav__link-label">Services</span><ArrowIcon diagonal /></NavigationLink>
        <NavigationLink href="/solutions"><span className="mobile-nav__link-label">Solutions</span><ArrowIcon diagonal /></NavigationLink>
        <NavigationLink href="/resources"><span className="mobile-nav__link-label">Resources</span><ArrowIcon diagonal /></NavigationLink>
        <div className="mobile-nav__subnav" aria-label="Resource links">
          <NavigationLink href="/blog"><span className="mobile-nav__link-label"><ArticleIcon />Blog</span><ArrowIcon diagonal /></NavigationLink>
          <NavigationLink href="/tools/it-health-check"><span className="mobile-nav__link-label">IT Health Check</span><ArrowIcon diagonal /></NavigationLink>
        </div>
        <NavigationLink href="/about"><span className="mobile-nav__link-label">About</span><ArrowIcon diagonal /></NavigationLink>
        <NavigationLink href="/support"><span className="mobile-nav__link-label">Support</span><ArrowIcon diagonal /></NavigationLink>
        {shopEnabled ? <NavigationLink href="/shop"><span className="mobile-nav__link-label">Shop</span><ArrowIcon diagonal /></NavigationLink> : null}
        <NavigationLink href="/login"><span className="mobile-nav__link-label"><AccountIcon />Client portal</span><ArrowIcon diagonal /></NavigationLink>
        <ChatBookingButton mobile />
      </nav>
    </details>
  );
}
