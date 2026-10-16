"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const prompts = [
  { text: "Computer running slowly?", href: "/services/it-support", label: "Explore IT support" },
  { text: "Microsoft 365 login problems?", href: "/services/microsoft-365", label: "Explore Microsoft 365" },
  { text: "Wi-Fi or network keeps disconnecting?", href: "/services/network-wifi", label: "Explore network help" },
  { text: "Worried about backups and cybersecurity?", href: "/services/backup-recovery", label: "Review backup planning" },
  { text: "Need help with a business website?", href: "/services/web-software", label: "Explore web services" },
  { text: "Too many repetitive manual tasks?", href: "/services/ai-automation", label: "Explore automation" },
] as const;

export function ServiceDiscoveryPanel() {
  const [index, setIndex] = useState(0);
  const [length, setLength] = useState(prompts[0].text.length);
  const [deleting, setDeleting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const current = prompts[index];

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const atEnd = length === current.text.length;
    const atStart = length === 0;
    const delay = atEnd && !deleting ? 1600 : deleting ? 34 : 58;
    const timer = window.setTimeout(() => {
      if (atEnd && !deleting) setDeleting(true);
      else if (atStart && deleting) {
        setDeleting(false);
        setIndex((value) => (value + 1) % prompts.length);
      } else setLength((value) => value + (deleting ? -1 : 1));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [current.text.length, deleting, length, paused, reducedMotion]);

  const visibleText = reducedMotion ? current.text : current.text.slice(0, length);
  return (
    <div
      className="service-discovery"
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}
      onFocus={() => setPaused(true)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span>What can we help with?</span>
      <p className="service-discovery__prompt" aria-hidden="true">
        <strong>{visibleText || "\u00a0"}</strong><i aria-hidden="true" />
      </p>
      <p className="sr-only">Choose a common technology problem or browse every BoomoTech service.</p>
      <p className="service-discovery__context">Start with the problem. The suggested page explains the likely next step without asking you to diagnose it.</p>
      <div className="service-discovery__actions">
        <Link href={current.href}>{current.label}</Link>
        <Link href="/booking">Request a consultation</Link>
      </div>
      <Link className="service-discovery__all" href="/services">View all services →</Link>
    </div>
  );
}
