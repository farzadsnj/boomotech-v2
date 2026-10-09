"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ChatBookingButton } from "./chat-booking-button";
import { MobileNavigation } from "./mobile-navigation";
import { DesktopNavigation } from "./desktop-navigation";

function AccountIcon() {
  return <svg aria-hidden="true" className="account-icon" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.7-4 3-6 7-6s6.3 2 7 6" /></svg>;
}

export function SiteHeader({ shopEnabled = false }: { shopEnabled?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 18);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="site-header__inner container">
        <BrandLogo />
        <DesktopNavigation />
        <Link className="account-link" href="/login"><AccountIcon /><span className="account-link__label">Client portal</span></Link>
        <ChatBookingButton />
        <MobileNavigation shopEnabled={shopEnabled} />
      </div>
    </header>
  );
}
