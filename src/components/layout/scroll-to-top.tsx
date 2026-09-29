"use client";

import { useEffect, useState } from "react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > 600 && document.documentElement.scrollHeight > window.innerHeight * 1.6);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  function goToTop() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    window.setTimeout(() => document.querySelector<HTMLElement>(".skip-link")?.focus(), reduced ? 0 : 450);
  }

  return <button aria-label="Back to top" className={`scroll-top${visible ? " is-visible" : ""}`} onClick={goToTop} tabIndex={visible ? 0 : -1} type="button"><span aria-hidden="true">↑</span></button>;
}
