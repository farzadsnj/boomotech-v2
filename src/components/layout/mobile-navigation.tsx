"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { site } from "@/content/site";

export function MobileNavigation() {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, [pathname]);

  return (
    <details className="mobile-nav" ref={detailsRef}>
      <summary aria-label="Toggle navigation">
        <span className="mobile-nav__label">Menu</span>
        <span aria-hidden="true" className="menu-lines"><i /><i /></span>
      </summary>
      <nav aria-label="Mobile primary">
        {site.navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}<ArrowIcon diagonal /></Link>)}
        <Link className="mobile-nav__cta" href="/book">Explore consultation<ArrowIcon diagonal /></Link>
      </nav>
    </details>
  );
}
