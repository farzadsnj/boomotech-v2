"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { site } from "@/content/site";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ChatBookingButton } from "./chat-booking-button";
import { NavigationLink } from "./navigation-link";
import { MobileNavigation } from "./mobile-navigation";
import { ArticleIcon } from "@/components/ui/article-icon";

function AccountIcon() {
  return <svg aria-hidden="true" className="account-icon" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.7-4 3-6 7-6s6.3 2 7 6" /></svg>;
}

export function SiteHeader() {
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
        <nav aria-label="Primary" className="desktop-nav">
          {site.navigation.map((item) => <NavigationLink key={item.href} href={item.href}>{item.href === "/blog" ? <ArticleIcon /> : null}<span>{item.label}</span></NavigationLink>)}
        </nav>
        <Link className="account-link" href="/login"><AccountIcon /><span className="sr-only">Customer account</span></Link>
        <ChatBookingButton />
        <MobileNavigation />
      </div>
    </header>
  );
}
