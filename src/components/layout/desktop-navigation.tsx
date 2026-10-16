"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { serviceGroups } from "@/content/service-groups";
import { NavigationLink } from "./navigation-link";
import { ServiceDiscoveryPanel } from "./service-discovery-panel";

function Chevron() { return <svg aria-hidden="true" viewBox="0 0 12 8"><path d="m1 1 5 5 5-5" /></svg>; }

export function DesktopNavigation() {
  const [open, setOpen] = useState<"services" | "resources" | null>(null);
  const root = useRef<HTMLElement>(null);
  const servicesTrigger = useRef<HTMLButtonElement>(null);
  const resourcesTrigger = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    const close = (event: KeyboardEvent | PointerEvent) => {
      if (event instanceof KeyboardEvent && event.key === "Escape" && open) {
        const trigger = open === "services" ? servicesTrigger.current : resourcesTrigger.current;
        setOpen(null);
        requestAnimationFrame(() => trigger?.focus());
      }
      if (event instanceof PointerEvent && root.current && !root.current.contains(event.target as Node)) setOpen(null);
    };
    document.addEventListener("keydown", close); document.addEventListener("pointerdown", close);
    return () => { document.removeEventListener("keydown", close); document.removeEventListener("pointerdown", close); };
  }, [open]);
  const serviceActive = pathname === "/services" || pathname.startsWith("/services/");
  const resourceActive = pathname === "/resources" || pathname.startsWith("/blog") || pathname.startsWith("/learning") || pathname.startsWith("/tools/");
  return <nav aria-label="Primary" className="desktop-nav professional-nav" onClick={(event) => { if ((event.target as HTMLElement).closest("a")) setOpen(null); }} ref={root}>
    <div className="nav-cluster">
      <NavigationLink href="/services">Services</NavigationLink><button aria-expanded={open === "services"} aria-label="Show services menu" onClick={() => setOpen(open === "services" ? null : "services")} ref={servicesTrigger} type="button"><Chevron /></button>
      {serviceActive ? <span className="sr-only">Current section</span> : null}
      {open === "services" ? <div className="mega-menu mega-menu--services">
        <ServiceDiscoveryPanel />
        <div className="mega-menu__groups">{serviceGroups.map((group) => <section key={group.id}><h3>{group.label}</h3><p>{group.heading}</p><ul>{group.services.map((service) => <li key={service.path}><Link href={service.path}>{service.name}</Link></li>)}</ul></section>)}</div>
      </div> : null}
    </div>
    <NavigationLink href="/solutions">Solutions</NavigationLink>
    <div className="nav-cluster">
      <Link aria-current={resourceActive ? "page" : undefined} href="/resources">Resources &amp; Learning</Link><button aria-expanded={open === "resources"} aria-label="Show resources and learning menu" onClick={() => setOpen(open === "resources" ? null : "resources")} ref={resourcesTrigger} type="button"><Chevron /></button>
      {resourceActive ? <span className="sr-only">Current section</span> : null}
      {open === "resources" ? <div className="mega-menu mega-menu--resources"><div className="mega-menu__resources-intro"><p className="eyebrow">RESOURCES &amp; LEARNING</p><strong>Learn, assess and choose a practical next step.</strong></div><Link href="/blog"><strong>Blog posts</strong><span>Practical guides for everyday technology decisions.</span></Link><Link href="/learning"><strong>Learning portal</strong><span>Preview future courses, lessons and practical learning paths.</span></Link><Link href="/tools/it-health-check"><strong>Free IT Health Check</strong><span>Identify useful priorities in around five minutes.</span></Link><Link href="/faq"><strong>Frequently asked questions</strong><span>Answers about services, safety and next steps.</span></Link></div> : null}
    </div>
    <NavigationLink href="/pricing">Pricing</NavigationLink>
    <NavigationLink href="/about">About</NavigationLink>
    <NavigationLink href="/support">Support</NavigationLink>
  </nav>;
}
