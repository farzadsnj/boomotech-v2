"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = React.ComponentProps<typeof Link>;

export function NavigationLink({ href, className = "", ...props }: Props) {
  const pathname = usePathname();
  const target = typeof href === "string" ? href : href.pathname ?? "";
  const active = target === "/" ? pathname === "/" : pathname === target || pathname.startsWith(`${target}/`);

  return (
    <Link
      {...props}
      aria-current={active ? "page" : undefined}
      className={`${className} ${active ? "is-current" : ""}`.trim()}
      href={href}
    />
  );
}
