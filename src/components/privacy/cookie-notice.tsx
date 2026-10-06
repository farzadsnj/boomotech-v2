"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const NOTICE_STORAGE_KEY = "boomotech-cookie-notice-seen";

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setVisible(localStorage.getItem(NOTICE_STORAGE_KEY) !== "yes");
      } catch {
        setVisible(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(NOTICE_STORAGE_KEY, "yes");
    } catch {
      // The notice can still be dismissed for the current page when storage is unavailable.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside className="cookie-notice" aria-label="Privacy and browser storage notice">
      <div>
        <strong>Privacy &amp; browser storage</strong>
        <p>
          BoomoTech uses essential cookies and limited local/session storage for secure sign-in and site preferences.
          We do not currently intentionally use analytics or advertising cookies.
        </p>
        <p className="cookie-notice__links">
          <Link href="/privacy">Privacy Policy</Link>
          <span aria-hidden="true">·</span>
          <Link href="/cookies">Cookies &amp; browser storage</Link>
        </p>
      </div>
      <button type="button" onClick={dismiss}>Got it</button>
    </aside>
  );
}
