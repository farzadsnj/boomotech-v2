"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavigationLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  return <Link href={href} className={className} aria-current={active ? "page" : undefined}>{children}</Link>;
}
