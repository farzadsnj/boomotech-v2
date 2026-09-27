"use client";

import Link, { type LinkProps } from "next/link";
import type { MouseEvent, ReactNode } from "react";

type Props = LinkProps & {
  children: ReactNode;
  className?: string;
  servicePath?: string;
  onAfterOpen?: () => void;
};

export function BookingActionLink({ children, className, servicePath, onAfterOpen, ...props }: Props) {
  function openBooking(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.dispatchEvent(new CustomEvent("boomotech:open-booking", {
      detail: { servicePath, trigger: event.currentTarget },
    }));
    onAfterOpen?.();
  }

  return <Link {...props} className={className} onClick={openBooking}>{children}</Link>;
}
